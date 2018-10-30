pragma solidity ^0.4.3;

interface IOrdersDB {
	
    function getOrderExists(bytes32 orderHash) external view returns (bool);

    function setOrderExists(bytes32 orderHash, bool value) external;
	
    function getOrderTimestamp(bytes32 orderHash) external view returns (uint256);

    function setOrderTimestamp(bytes32 orderHash, uint256 value) external;

    function getOrderIsBid(bytes32 orderHash) external view returns (bool);

    function setOrderIsBid(bytes32 orderHash, bool value) external;

    function getOrderIsOpen(bytes32 orderHash) external view returns (bool);
    
    function setOrderIsOpen(bytes32 orderHash, bool value) external;

    function getOrderOwner(bytes32 orderHash) external view returns (address);
    
    function setOrderOwner(bytes32 orderHash, address value) external;

    function getOrderToken(bytes32 orderHash) external view returns (address);
    
    function setOrderToken(bytes32 orderHash, address value) external;

    function getOrderBase(bytes32 orderHash) external view returns (address);
    
    function setOrderBase(bytes32 orderHash, address value) external;

    function getOrderPrice(bytes32 orderHash) external view returns (uint256);
    
    function setOrderPrice(bytes32 orderHash, uint256 value) external;

    function getOrderQuantity(bytes32 orderHash) external view returns (uint256);
    
    function setOrderQuantity(bytes32 orderHash, uint256 value) external;

    function getOrderVolume(bytes32 orderHash) external view returns (uint256);
    
    function setOrderVolume(bytes32 orderHash, uint256 value) external;

    function getOrderFilledVolume(bytes32 orderHash) external view returns (uint256);
    
    function addOrderFilledVolume(bytes32 orderHash, uint256 value) external;

    function getOrderAvailableVolume(bytes32 orderHash) external view returns (uint256);

}