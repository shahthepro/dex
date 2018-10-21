pragma solidity ^0.4.23;

library DEXConstants {
    uint8 public constant WALLET_PREFIX = 0xF0;
    uint8 public constant BALANCE_KEY = 0xF1;
    uint8 public constant ESCROW_KEY = 0xF2;

    uint8 public constant ORDER_PREFIX = 0xA0;
    uint8 public constant ORDER_OWNER_KEY = 0xA1;
    uint8 public constant ORDER_TOKEN_KEY = 0xA2;
    uint8 public constant ORDER_BASE_KEY = 0xA3;
    uint8 public constant ORDER_PRICE_KEY = 0xA4;
    uint8 public constant ORDER_QUANTITY_KEY = 0xA5;
    uint8 public constant ORDER_VOLUME_KEY = 0xA6;
    uint8 public constant ORDER_VOLUME_FILLED_KEY = 0xA7;
    uint8 public constant ORDER_IS_BID_KEY = 0xA8;
    uint8 public constant ORDER_EXISTS_KEY = 0xA9;
    uint8 public constant ORDER_OPEN_KEY = 0xAA;

    uint8 public constant FEES_PREFIX = 0xB0;
    uint8 public constant FEES_ACCOUNT_KEY = 0xB1;
    uint8 public constant FEES_CANCEL_KEY = 0xB2;
}