pragma solidity ^0.4.24;

import "./ERC721.sol";
import "./ERC721BasicToken.sol";
import "./SupportsInterfaceWithLookup.sol";


/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Tamagotchis is SupportsInterfaceWithLookup, ERC721BasicToken, ERC721 {

    uint256 public purchaseAmount = 0.02 ether;

    // Token name
    string internal name_;

    // Token symbol
    string internal symbol_;

    enum TamaState {
      Egg,
      Normal,
      Hungry,
      Sick,
      Dead
    }

    // Array with all tama ids, used for enumeration
    uint256[] internal allTokens;

    // Mapping from owner to list of owned tama IDs
    mapping(address => uint256[]) internal ownedTokens;

    // Mapping from token ID to index of the owner tamas list
    mapping(uint256 => uint256) internal ownedTokensIndex;

    // Mapping from tama id to position in the allTokens array
    mapping(uint256 => uint256) internal allTokensIndex;

    /*
     *  Splitting up the Tama stats into a single uint256 int
     *  Bits 0 from 47 = age
     *  Bits 48 from 95 = birth
     *  Bits 96 from 143 = lastInteraction
     *  Bits 144 from 159 = happiness
     *  Bits 160 from 167 = state
     *  Bit 168 = exists
     */
    // Optional mapping from id to tama stats encoded in uint256
    mapping(uint256 => uint256) internal tamaStats;

    modifier tamaIDExists(uint256 _tamaId) {
        require(exists(_tamaId), "TamaID entered does not exist.");
        _;
    }

    /**
    * @dev Constructor function
    */
    constructor(string _name, string _symbol) public {
        name_ = _name;
        symbol_ = _symbol;
        // register the supported interfaces to conform to ERC721 via ERC165
        _registerInterface(InterfaceId_ERC721Enumerable);
        _registerInterface(InterfaceId_ERC721Metadata);
    }

    /**
    * @dev Gets the token name
    * @return string representing the token name
    */
    function name() external view returns (string) {
        return name_;
    }

    /**
    * @dev Gets the token symbol
    * @return string representing the token symbol
    */
    function symbol() external view returns (string) {
        return symbol_;
    }

    /**
    * @dev Returns if a given Tama ID exists
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaStatsByID(uint256 _tamaId)
        public
        view
        tamaIDExists(_tamaId)
        returns (uint256)
    {
        return tamaStats[_tamaId];
    }

    /**
    * @dev Returns if a given Tama ID exists
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaAgeByID(uint256 _tamaId)
        public
        view
        tamaIDExists(_tamaId)
        returns (uint256)
    {
        return uint256(uint48(tamaStats[_tamaId]));
    }

    /**
    * @dev Returns the age for a given Tama ID
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaExistsByID(uint256 _tamaId) public view returns (bool) {
        return exists(_tamaId);
    }

    /**
    * @dev Returns the birth block for a given Tama ID
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaBirthBlockByID(uint256 _tamaId)
        public
        view
        tamaIDExists(_tamaId)
        returns (uint256)
    {
        return uint256(uint48(tamaStats[_tamaId]>>48));
    }

    /**
    * @dev Returns the last checkIn for a given Tama ID
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaLastInteractionByID(uint256 _tamaId)
        public
        view
        tamaIDExists(_tamaId)
        returns (uint256)
    {
        return uint256(uint48(tamaStats[_tamaId]>>96));
    }

    /**
    * @dev Returns the happiness for a given Tama ID
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaHappinessByID(uint256 _tamaId)
        public
        view
        tamaIDExists(_tamaId)
        returns (uint256)
    {
        return uint256(uint16(tamaStats[_tamaId]>>144));
    }

    /**
    * @dev Returns the state for a given Tama ID
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tamaId uint256 ID of the tama to query
    */
    function tamaStateByID(uint256 _tamaId)
        public
        view
        tamaIDExists(_tamaId)
        returns (TamaState)
    {
        return TamaState(uint8(tamaStats[_tamaId]>>160));
    }

    /**
    * @dev Checks into the tama's house
    * Throws if the tama ID does not exist
    */
    function checkInToTama(uint256 _tamaId) public tamaIDExists(_tamaId) {
        uint256 tama = tamaStats[_tamaId];
        require(TamaState(tamaState(tama)) != TamaState.Dead, "Dead Tamas cannot be fed.");
        // require(TamaState(tamaState(tama)) != TamaState.Egg);
        uint256 clean = uint256(uint48(tama>>48))<<48 | calcHappiness(tama)<<144 | tama>>160<<160;
        tamaStats[_tamaId] = clean | block.number<<96 | calcTamaAge(tamaAge(tama) | uint256(uint48(tama>>96))<<96 | clean);
    }

    /**
    * @dev Performs modifications to age of ID sent to it.
    * Throws if the tama ID does not exist
    */
    function calcTamaAge(uint256 _tama) internal view returns (uint256) {
        uint256 blocksSince = block.number - tamaLastInteraction(_tama);
        if(tamaHappiness(_tama) == 0 || blocksSince > 104040) {
            return uint256(uint48(_tama) + (blocksSince * tamaHappiness(_tama)/140)) | uint256(TamaState.Dead)<<160;
        }
        return uint48(_tama) + (blocksSince * tamaHappiness(_tama)/140);
    }

    /*
     * Happiness decays at a rate of 140 + 60 - 2x/185, 60 is room for increasing happiness
     * So if I'm at 150 happiness, and I wait 2880 blocks (12 hours) to feed,
     * Happiness becomes 140 + 60 - (288*4/370) = 170, so its still safe
     *
     * However, if I wait 36 hours to feed, happiness becomes 110, which is technically decay
    */
    function calcHappiness(uint256 tama) internal view returns (uint256) {
        uint256 decay = 2*(block.number - tamaLastInteraction(tama))/185;
        uint256 maxHappy = tamaHappiness(tama) + 60;

        if (maxHappy <= decay) {
            return 0;
        } else if (maxHappy >= 140) {
            return 200;
        }
        return maxHappy - decay;
    }

    /**
    * @dev Creates a new Tama for a set amount of Eth
    *
    */
    function createTama(address _to, uint256 _tokenID) public payable {
        require(msg.value >= purchaseAmount, "Not enough ETH sent.");
        _mint(_to, _tokenID);
        _initializeTama(_tokenID);
    }

    /**
    * @dev Internal function to initialize tama stats
    * Reverts if token ID doesn't exist
    * @param _tokenID uint256 ID of the token to initialize
    */
    function _initializeTama(uint256 _tokenID) internal {
        require(exists(_tokenID), "ID does not exist.");
        tamaStats[_tokenID] = 0 | block.number<<48 | block.number<<96 | 140<<144 | 0<<160;
    }

    /**
    * @dev Gets the token ID at a given index of the tokens list of the requested owner
    * @param _owner address owning the tokens list to be accessed
    * @param _index uint256 representing the index to be accessed of the requested tokens list
    * @return uint256 token ID at the given index of the tokens list owned by the requested address
    */
    function tokenOfOwnerByIndex(address _owner, uint256 _index)
      public
      view
      returns (uint256)
    {
        require(_index < balanceOf(_owner), "Out of bounds of owner's tokens.");
        return ownedTokens[_owner][_index];
    }

    /**
    * @dev Gets the total amount of tokens stored by the contract
    * @return uint256 representing the total amount of tokens
    */
    function totalSupply() public view returns (uint256) {
        return allTokens.length;
    }


    /**
    * @dev Returns the age for a given Tama uint256
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tama uint256 data uint of the tama to decode
    */
    function tamaAge(uint256 _tama) internal pure returns (uint256) {
        return uint256(uint48(_tama));
    }

    /**
    * @dev Returns the birth for a given tama uint256
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tama uint256 data uint of the tama to decode
    */
    function tamaBirthBlock(uint256 _tama) internal pure returns (uint256) {
        return uint256(uint48(_tama>>48));
    }

    /**
    * @dev Returns the last interaction for a given tama uint256
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tama uint256 data uint of the tama to decode
    */
    function tamaLastInteraction(uint256 _tama) internal pure returns (uint256) {
        return uint256(uint48(_tama>>96));
    }

    /**
    * @dev Returns the happiness for a given Tama uint256
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tama uint256 data uint of the tama to decode
    */
    function tamaHappiness(uint256 _tama) internal pure returns (uint256) {
        return uint256(uint16(_tama>>144));
    }

    /**
    * @dev Returns the state for a given Tama uint256
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tama uint256 data uint of the tama to decode
    */
    function tamaState(uint256 _tama) internal pure returns (TamaState) {
        return TamaState(uint8(_tama>>160));
    }

    /**
    * @dev Returns the existence for a given Tama uint256
    * Throws if the tama ID does not exist. May return an empty string.
    * @param _tama uint256 data uint of the tama to decode
    */
    function tamaExists(uint256 _tama) internal pure returns (bool) {
        return uint8(_tama>>167) == 1;
    }

    /**
    * @dev Gets the token ID at a given index of all the tokens in this contract
    * Reverts if the index is greater or equal to the total number of tokens
    * @param _index uint256 representing the index to be accessed of the tokens list
    * @return uint256 token ID at the given index of the tokens list
    */
    function tokenByIndex(uint256 _index) public view returns (uint256) {
        require(_index < totalSupply(), "Out of bounds of total supply.");
        return allTokens[_index];
    }

    // /**
    // * @dev Internal function to set the token URI for a given token
    // * Reverts if the token ID does not exist
    // * @param _tokenId uint256 ID of the token to set its URI
    // * @param _uri string URI to assign
    // */
    // function _setTokenURI(uint256 _tokenId, string _uri) internal {
    //     require(exists(_tokenId));
    //     tokenURIs[_tokenId] = _uri;
    // }

    /**
    * Internal use only, if you'd like to make new tokens just stick to _mint()
    * @dev Internal function to add a token ID to the list of a given address
    * @param _to address representing the new owner of the given token ID
    * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
    */
    function addTokenTo(address _to, uint256 _tokenId) internal {
        super.addTokenTo(_to, _tokenId);
        uint256 length = ownedTokens[_to].length;
        ownedTokens[_to].push(_tokenId);
        ownedTokensIndex[_tokenId] = length;
    }

    /**
    * @dev Internal function to remove a token ID from the list of a given address
    * @param _from address representing the previous owner of the given token ID
    * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given address
    */
    function removeTokenFrom(address _from, uint256 _tokenId) internal {
        super.removeTokenFrom(_from, _tokenId);

        uint256 tokenIndex = ownedTokensIndex[_tokenId];
        uint256 lastTokenIndex = ownedTokens[_from].length.sub(1);
        uint256 lastToken = ownedTokens[_from][lastTokenIndex];

        ownedTokens[_from][tokenIndex] = lastToken;
        ownedTokens[_from][lastTokenIndex] = 0;
        // Note that this will handle single-element arrays. In that case, both tokenIndex and lastTokenIndex are going to
        // be zero. Then we can make sure that we will remove _tokenId from the ownedTokens list since we are first swapping
        // the lastToken to the first position, and then dropping the element placed in the last position of the list

        ownedTokens[_from].length--;
        ownedTokensIndex[_tokenId] = 0;
        ownedTokensIndex[lastToken] = tokenIndex;
    }

    /**
    * @dev Internal function to mint a new token
    * Reverts if the given token ID already exists
    * @param _to address the beneficiary that will own the minted token
    * @param _tokenId uint256 ID of the token to be minted by the msg.sender
    */
    function _mint(address _to, uint256 _tokenId) internal {
        super._mint(_to, _tokenId);

        allTokensIndex[_tokenId] = allTokens.length;
        allTokens.push(_tokenId);
    }

    /**
    * @dev Internal function to burn a specific token
    * Reverts if the token does not exist
    * @param _owner owner of the token to burn
    * @param _tokenId uint256 ID of the token being burned by the msg.sender
    */
    function _burn(address _owner, uint256 _tokenId) internal {
        super._burn(_owner, _tokenId);

        // Clear metadata (if any)
        // if (bytes(tokenURIs[_tokenId]).length != 0) {
        //     delete tokenURIs[_tokenId];
        // }

        // Clear tama stats (if any)
        if (tamaExists(tamaStats[_tokenId])) {
            delete tamaStats[_tokenId];
        }

        // Reorg all tokens array
        uint256 tokenIndex = allTokensIndex[_tokenId];
        uint256 lastTokenIndex = allTokens.length.sub(1);
        uint256 lastToken = allTokens[lastTokenIndex];

        allTokens[tokenIndex] = lastToken;
        allTokens[lastTokenIndex] = 0;

        allTokens.length--;
        allTokensIndex[_tokenId] = 0;
        allTokensIndex[lastToken] = tokenIndex;
    }
}