(
rm -rf $DEX_DAPP_BUILD_DIR
# rm -rf $DEX_DAPP_LIB_DEST_DIR
# cp -r $DEX_DAPP_LIB_DIR $DEX_DAPP_LIB_DEST_DIR
mkdir $DEX_DAPP_BUILD_DIR
cd $DEX_DAPP_SRC_DIR
#solc Exchange.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/Exchange.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR HomeBridge.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/HomeBridge.json

solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR core/DataStore.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/DataStore.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR DEXChain.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/DEXChain.json
solc openzeppelin-solidity=$DEX_DAPP_LIB_DIR Orderbook.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > $DEX_DAPP_BUILD_DIR/Orderbook.json
# rm -rf $DEX_DAPP_LIB_DEST_DIR
)