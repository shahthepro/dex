import IWallet from '@/interfaces/iwallet'
import EWalletTypes from '@/enums/wallet-types'
import createNewKeystore from '@/utils/connectors/new-keystore.wallet'
import connectSoftwareWallet from '@/utils/connectors/software.wallet'
import unlockWithPrivateKey from '@/utils/connectors/private-key.wallet'
import unlockWithKeystoreFile from '@/utils/connectors/keystore.wallet'

interface IConnectWalletArgs {
  type: EWalletTypes
  privateKey?: string
  keystoreFile?: File
  passphrase?: string
}

async function connectWallet(args: IConnectWalletArgs): Promise<IWallet> {
  let wallet: IWallet

  switch (args.type) {
    case EWalletTypes.NewKeystore:
      wallet = await createNewKeystore(args.passphrase!)
      return wallet
    case EWalletTypes.SoftwareWallet:
      wallet = await connectSoftwareWallet()
      return wallet

    case EWalletTypes.PrivateKey:
      wallet = await unlockWithPrivateKey(args.privateKey!)
      return wallet

    case EWalletTypes.KeystoreFile:
      wallet = await unlockWithKeystoreFile(args.keystoreFile!, args.passphrase!)
      return wallet

    default:
      throw new Error("Unsupported Wallet Type")
  }
}

export default connectWallet