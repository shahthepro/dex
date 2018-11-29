(
rm -rf $DEX_DAPP_BUILD_DIR
# rm -rf $DEX_DAPP_LIB_DEST_DIR
# cp -r $DEX_DAPP_LIB_DIR $DEX_DAPP_LIB_DEST_DIR
mkdir $DEX_DAPP_BUILD_DIR
cd $DEX_DAPP_SRC_DIR
#solc Exchange.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/Exchange.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 HomeBridge.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/HomeBridge.json

solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 DataStore.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/DataStore.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 DEXChain.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/DEXChain.json
# solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 Orderbook.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/Orderbook.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 FeeContract.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/FeeContract.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 OrdersDB.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/OrdersDB.json
# solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 NewOrderContract.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/NewOrderContract.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 Orderbook.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/Orderbook.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR --optimize --optimize-runs 1 OrderMatchContract.sol --combined-json abi,asm,ast,bin,bin-runtime,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/OrderMatchContract.json
# rm -rf $DEX_DAPP_LIB_DEST_DIR
)