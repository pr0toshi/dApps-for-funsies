pragma solidity ^0.4.23;

import "./token.sol";
import "./ERC223ReceivingContract.sol";

/// @title Dutch auction contract - distribution of a fixed number of tokens using an auction.
/// The contract code is inspired by the Gnosis auction contract. Main difference is that the
/// auction ends if a fixed number of tokens was sold. It is then changed upon for Waifu's needs.
contract DutchAuction is ERC223ReceivingContract {
    /*
     * Auction for the WAIFU Token.
     *
     * Terminology:
     * 1 token unit = Loli
     * 1 token = WAIFU = Loli * token_multiplier
     * token_multiplier set from token's number of decimals (i.e. 10 ** decimals)
     */

    // Wait 7 days after the end of the auction, before anyone can claim tokens
    uint constant public token_claim_waiting_period = 7 days;

    /*
     * Storage
     */

    WaifuToken public token;
    address public owner_address;
    address public wallet_address;

    // Price decay function parameters to be changed depending on the desired outcome

    // Starting price in WEI; e.g. 2 * 10 ** 18
    uint32 public price_exponent; // Divisor exponent; e.g. 3

    uint public price_start;
    // Divisor constant; e.g. 524880000
    uint public price_constant;

    // For calculating elapsed time for price
    uint public start_time;
    uint public end_time;
    uint public start_block;

    // Keep track of all ETH received in the bids
    uint public received_wei;

    // Keep track of cumulative ETH funds for which the tokens have been claimed
    uint public funds_claimed;

    // 10 ** decimals
    uint public token_multiplier;

    // Total number of Loli (Waifu * token_multiplier) that will be auctioned
    uint public num_tokens_auctioned;

    // Wei per WAIFU (Loli * token_multiplier)
    uint public final_price;

    // Bidder address => bid value
    mapping (address => uint) public bids;

    Stages public stage;

    /*
     * Enums
     */
    enum Stages {
        AuctionDeployed,
        AuctionSetUp,
        AuctionStarted,
        AuctionEnded,
        TokensDistributed
    }

    /*
     * Modifiers
     */
    modifier atStage(Stages _stage) {
        require(stage == _stage);
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner_address);
        _;
    }

    /*
     * Events
     */

    event Deployed(
        uint indexed _price_start,
        uint indexed _price_constant,
        uint32 indexed _price_exponent
    );
    event Setup();
    event AuctionStarted(uint indexed _start_time, uint indexed _block_number);
    event BidSubmission(
        address indexed _sender,
        uint _amount,
        uint _missing_funds
    );
    event ClaimedTokens(address indexed _recipient, uint _sent_amount);
    event AuctionEnded(uint _final_price);
    event TokensDistributed();

    /*
     * Public functions
     */

    /// @dev Contract constructor function sets the starting price, divisor constant and
    /// divisor exponent for calculating the Dutch Auction price.
    /// @param _wallet_address Wallet address to which all contributed ETH will be forwarded.
    /// @param _price_start High price in WEI at which the auction starts.
    /// @param _price_constant Auction price divisor constant.
    /// @param _price_exponent Auction price divisor exponent.
    constructor(
        address _wallet_address,
        uint _price_start,
        uint _price_constant,
        uint32 _price_exponent)
        public
    {
        require(_wallet_address != 0x0);
        wallet_address = _wallet_address;

        owner_address = msg.sender;
        stage = Stages.AuctionDeployed;
        changeSettings(_price_start, _price_constant, _price_exponent);
        emit Deployed(_price_start, _price_constant, _price_exponent);
    }

    /// @dev Fallback function for the contract, which calls bid() if the auction has started.
    function () public payable atStage(Stages.AuctionStarted) {
        bid();
    }

    /// @notice Set `_token_address` as the token address to be used in the auction.
    /// @dev Setup function sets external contracts addresses.
    /// @param _token_address Token address.
    function setup(address _token_address) public isOwner atStage(Stages.AuctionDeployed) {
        require(_token_address != 0x0);
        token = WaifuToken(_token_address);

        // Get number of Loli (WAIFU * token_multiplier) to be auctioned from token auction balance
        num_tokens_auctioned = token.balanceOf(address(this));

        // Set the number of the token multiplier for its decimals
        token_multiplier = 10 ** uint(token.decimals());

        stage = Stages.AuctionSetUp;
        emit Setup();
    }

    /// @notice Set `_price_start`, `_price_constant` and `_price_exponent` as
    /// the new starting price, price divisor constant and price divisor exponent.
    /// @dev Changes auction price function parameters before auction is started.
    /// @param _price_start Updated start price.
    /// @param _price_constant Updated price divisor constant.
    /// @param _price_exponent Updated price divisor exponent.
    function changeSettings(
        uint _price_start,
        uint _price_constant,
        uint32 _price_exponent)
        internal
    {
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        require(_price_start > 0);
        require(_price_constant > 0);

        price_start = _price_start;
        price_constant = _price_constant;
        price_exponent = _price_exponent;
    }

    /// @notice Start the auction.
    /// @dev Starts auction and sets start_time.
    function startAuction() public isOwner atStage(Stages.AuctionSetUp) {
        stage = Stages.AuctionStarted;
        start_time = now;
        start_block = block.number;
        emit AuctionStarted(start_time, start_block);
    }

    /// @notice Finalize the auction - sets the final WAIFU token price and changes the auction
    /// stage after no bids are allowed anymore.
    /// @dev Finalize auction and set the final WAIFU token price.
    function finalizeAuction() public atStage(Stages.AuctionStarted)
    {
        // Missing funds should be 0 at this point
        uint missing_funds = missingFundsToEndAuction();
        require(missing_funds == 0);

        // Calculate the final price = WEI / WAIFU = WEI / (Loli / token_multiplier)
        // Reminder: num_tokens_auctioned is the number of Loli (WAIFU * token_multiplier) that are auctioned
        final_price = token_multiplier * received_wei / num_tokens_auctioned;

        end_time = now;
        stage = Stages.AuctionEnded;
        emit AuctionEnded(final_price);

        assert(final_price > 0);
    }

    /// --------------------------------- Auction Functions ------------------


    /// @notice Send `msg.value` WEI to the auction from the `msg.sender` account.
    /// @dev Allows to send a bid to the auction.
    function bid()
        public
        payable
        atStage(Stages.AuctionStarted)
    {
        require(msg.value > 0);
        assert(bids[msg.sender] + msg.value >= msg.value);

        // Missing funds without the current bid value
        uint missing_funds = missingFundsToEndAuction();

        // We require bid values to be less than the funds missing to end the auction
        // at the current price.
        require(msg.value <= missing_funds);

        bids[msg.sender] += msg.value;
        received_wei += msg.value;

        // Send bid amount to wallet
        wallet_address.transfer(msg.value);

        emit BidSubmission(msg.sender, msg.value, missing_funds);

        assert(received_wei >= msg.value);
    }

    /// @notice Claim auction tokens for `msg.sender` after the auction has ended.
    /// @dev Claims tokens for `msg.sender` after auction. To be used if tokens can
    /// be claimed by beneficiaries, individually.
    function claimTokens() public atStage(Stages.AuctionEnded) returns (bool) {
        return proxyClaimTokens(msg.sender);
    }

    /// @notice Claim auction tokens for `receiver_address` after the auction has ended.
    /// @dev Claims tokens for `receiver_address` after auction has ended.
    /// @param receiver_address Tokens will be assigned to this address if eligible.
    function proxyClaimTokens(address receiver_address)
        public
        atStage(Stages.AuctionEnded)
        returns (bool)
    {
        // Waiting period after the end of the auction, before anyone can claim tokens
        // Ensures enough time to check if auction was finalized correctly
        // before users start transacting tokens
        require(now > end_time + token_claim_waiting_period);
        require(receiver_address != 0x0);

        if (bids[receiver_address] == 0) {
            return false;
        }

        // Number of Loli = bid_wei / Loli = bid_wei / (wei_per_WAIFU * token_multiplier)
        uint num = (token_multiplier * bids[receiver_address]) / final_price;

        // Due to final_price floor rounding, the number of assigned tokens may be higher
        // than expected. Therefore, the number of remaining unassigned auction tokens
        // may be smaller than the number of tokens needed for the last claimTokens call
        uint auction_tokens_balance = token.balanceOf(address(this));
        if (num > auction_tokens_balance) {
            num = auction_tokens_balance;
        }

        // Update the total amount of funds for which tokens have been claimed
        funds_claimed += bids[receiver_address];

        // Set receiver bid to 0 before assigning tokens
        bids[receiver_address] = 0;

        require(token.transfer(receiver_address, num));

        emit ClaimedTokens(receiver_address, num);

        // After the last tokens are claimed, we change the auction stage
        // Due to the above logic, rounding errors will not be an issue
        if (funds_claimed == received_wei) {
            stage = Stages.TokensDistributed;
            emit TokensDistributed();
        }

        assert(token.balanceOf(receiver_address) >= num);
        assert(bids[receiver_address] == 0);
        return true;
    }

    /// @notice Get the WAIFU price in WEI during the auction, at the time of
    /// calling this function. Returns `0` if auction has ended.
    /// Returns `price_start` before auction has started.
    /// @dev Calculates the current WAIFU token price in WEI.
    /// @return Returns WEI per WAIFU (token_multiplier * Loli).
    function price() public view returns (uint) {
        if (stage == Stages.AuctionEnded ||
            stage == Stages.TokensDistributed) {
            return 0;
        }
        return calcTokenPrice();
    }

    /// @notice Get the missing funds needed to end the auction,
    /// calculated at the current WAIFU price in WEI.
    /// @dev The missing funds amount necessary to end the auction at the current WAIFU price in WEI.
    /// @return Returns the missing funds amount in WEI.
    function missingFundsToEndAuction() view public returns (uint) {

        // num_tokens_auctioned = total number of Loli (WAIFU * token_multiplier) that is auctioned
        uint required_wei_at_price = num_tokens_auctioned * price() / token_multiplier;
        if (required_wei_at_price <= received_wei) {
            return 0;
        }

        // assert(required_wei_at_price - received_wei > 0);
        return required_wei_at_price - received_wei;
    }

    /*
     *  Private functions
     */

    /// @dev Calculates the token price (WEI / WAIFU) at the current timestamp
    /// during the auction; elapsed time = 0 before auction starts.
    /// Based on the provided parameters, the price does not change in the first
    /// `price_constant^(1/price_exponent)` seconds due to rounding.
    /// Rounding in `decay_rate` also produces values that increase instead of decrease
    /// in the beginning; these spikes decrease over time and are noticeable
    /// only in first hours. This should be calculated before usage.
    /// @return Returns the token price - Wei per WAIFU.
    function calcTokenPrice() view private returns (uint) {
        uint elapsed;
        if (stage == Stages.AuctionStarted) {
            elapsed = now - start_time;
        }

        uint decay_rate = elapsed ** price_exponent / price_constant;
        return price_start * (1 + elapsed) / (1 + elapsed + decay_rate);
    }

    // Only accept tokens when the auction is deployed.
    function tokenFallback(address _from, uint256 _value, bytes _data) public {
        require(stage == Stages.AuctionDeployed);
    }
}