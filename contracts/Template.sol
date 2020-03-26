pragma solidity 0.4.24;

import "@aragon/templates-shared/contracts/TokenCache.sol";
import "@aragon/templates-shared/contracts/BaseTemplate.sol";

import "./Transactions.sol";


contract Template is BaseTemplate, TokenCache {
    string constant private ERROR_EMPTY_HOLDERS = "TEMPLATE_EMPTY_HOLDERS";
    string constant private ERROR_BAD_HOLDERS_STAKES_LEN = "TEMPLATE_BAD_HOLDERS_STAKES_LEN";
    string constant private ERROR_BAD_VOTE_SETTINGS = "TEMPLATE_BAD_VOTE_SETTINGS";

    address constant private ANY_ENTITY = address(-1);
    bool constant private TOKEN_TRANSFERABLE = true;
    uint8 constant private TOKEN_DECIMALS = uint8(18);
    uint256 constant private TOKEN_MAX_PER_ACCOUNT = uint256(0);
    uint64 constant private DEFAULT_FINANCE_PERIOD = uint64(30 days);

    constructor (
        DAOFactory _daoFactory,
        ENS _ens,
        MiniMeTokenFactory _miniMeFactory,
        IFIFSResolvingRegistrar _aragonID
    )
        BaseTemplate(_daoFactory, _ens, _miniMeFactory, _aragonID)
        public
    {
        _ensureAragonIdIsValid(_aragonID);
        _ensureMiniMeFactoryIsValid(_miniMeFactory);
    }

    /**
    * @dev Create a new MiniMe token and deploy a Template DAO.
    * @param _tokenName String with the name for the token used by share holders in the organization
    * @param _tokenSymbol String with the symbol for the token used by share holders in the organization
    * @param _holders Array of token holder addresses
    * @param _stakes Array of token stakes for holders (token has 18 decimals, multiply token amount `* 10^18`)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    */
    function newTokenAndInstance(
        string _tokenName,
        string _tokenSymbol,
        address[] _holders,
        uint256[] _stakes,
        uint64[3] _votingSettings
    )
        external
    {
        newToken(_tokenName, _tokenSymbol);
        newInstance(_holders, _stakes, _votingSettings);
    }

    /**
    * @dev Create a new MiniMe token and cache it for the user
    * @param _name String with the name for the token used by share holders in the organization
    * @param _symbol String with the symbol for the token used by share holders in the organization
    */
    function newToken(string memory _name, string memory _symbol) public returns (MiniMeToken) {
        MiniMeToken token = _createToken(_name, _symbol, TOKEN_DECIMALS);
        _cacheToken(token, msg.sender);
        return token;
    }

    /**
    * @dev Deploy a Template DAO using a previously cached MiniMe token
    * @param _holders Array of token holder addresses
    * @param _stakes Array of token stakes for holders (token has 18 decimals, multiply token amount `* 10^18`)
    * @param _votingSettings Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization
    */
    function newInstance(
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings
    )
        public
    {
        _ensureTemplateSettings(_holders, _stakes, _votingSettings);

        (Kernel dao, ACL acl) = _createDAO();
        (Voting voting, Finance finance) = _setupBaseApps(dao, acl, _holders, _stakes, _votingSettings);
        _createEvmScriptsRegistryPermissions(acl, voting, voting);
        // Setup transactions app
        _setupCustomApp(dao, acl, voting);
        MiniMeToken token = _createToken("Token 2", "TKN2", TOKEN_DECIMALS);
        _cacheToken(token, msg.sender);
        _setupBaseApps(dao, acl, _holders, _stakes, _votingSettings);
        _transferCreatePaymentManagerFromTemplate(acl, finance, voting);
        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, voting);
    }

    function _setupBaseApps(
        Kernel _dao,
        ACL _acl,
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings
    )
        internal
        returns (Voting, Finance)
    {
        MiniMeToken token = _popTokenCache(msg.sender);
        Vault vault = _installVaultApp(_dao);
        Finance finance = _installFinanceApp(_dao, vault, DEFAULT_FINANCE_PERIOD);
        TokenManager tokenManager = _installTokenManagerApp(_dao, token, TOKEN_TRANSFERABLE, TOKEN_MAX_PER_ACCOUNT);
        Voting voting = _installVotingApp(_dao, token, _votingSettings);

        _mintTokens(_acl, tokenManager, _holders, _stakes);
        _setupBasePermissions(_acl, vault, voting, finance, tokenManager);

        return (voting, finance);
    }

    function _setupBasePermissions(
        ACL _acl,
        Vault _vault,
        Voting _voting,
        Finance _finance,
        TokenManager _tokenManager
    )
        internal
    {
        _createVaultPermissions(_acl, _vault, _finance, _voting);
        _createFinancePermissions(_acl, _finance, _voting, _voting);
        _createFinanceCreatePaymentsPermission(_acl, _finance, _voting, address(this));
        _createVotingPermissions(_acl, _voting, _voting, _tokenManager, _voting);
        _createTokenManagerPermissions(_acl, _tokenManager, _voting, _voting);
    }

    // Next we install and create permissions for the transactions app
    //--------------------------------------------------------------//
    function _setupCustomApp(
        Kernel _dao,
        ACL _acl,
        Voting _voting
    )
        internal
    {
        Transactions app = _installTransactions(_dao);
        _createTransactionsPermissions(_acl, app, _voting, _voting);
    }

    function _installTransactions(
        Kernel _dao
    )
        internal returns (Transactions)
    {
        bytes32 _appId = keccak256(abi.encodePacked(apmNamehash("open"), keccak256("transactions")));
        bytes memory initializeData = abi.encodeWithSelector(Transactions(0).initialize.selector);
        return Transactions(_installDefaultApp(_dao, _appId, initializeData));
    }

    function _createTransactionsPermissions(
        ACL _acl,
        Transactions _app,
        address _grantee,
        address _manager
    )
        internal
    {
        _acl.createPermission(_grantee, _app, "0x0", _manager); // Dummy role
    }

    //--------------------------------------------------------------//

    function _ensureTemplateSettings(
        address[] memory _holders,
        uint256[] memory _stakes,
        uint64[3] memory _votingSettings
    )
        private
        pure
    {
        require(_holders.length > 0, ERROR_EMPTY_HOLDERS);
        require(_holders.length == _stakes.length, ERROR_BAD_HOLDERS_STAKES_LEN);
        require(_votingSettings.length == 3, ERROR_BAD_VOTE_SETTINGS);
    }
}
