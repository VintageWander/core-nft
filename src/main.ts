import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { readFile } from "fs/promises";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createV1,
  getAssetV1GpaBuilder,
  Key,
  transferV1,
  freezeAsset,
  fetchAssetV1,
  thawAsset,
  fetchAsset,
  burn,
} from "@metaplex-foundation/mpl-core";
import { Connection } from "@solana/web3.js";
import wallet from "/Users/wander/.config/solana/id.json";

const umi = createUmi("https://api.devnet.solana.com", "finalized");
umi.use(irysUploader());

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(myKeypairSigner));

// Monkey patch the Connection prototype
Connection.prototype.getRecentBlockhash = async function (commitment) {
  try {
    const { blockhash, lastValidBlockHeight } = await this.getLatestBlockhash(
      commitment
    );
    const recentPrioritizationFees = await this.getRecentPrioritizationFees();
    const averageFee =
      recentPrioritizationFees.length > 0
        ? recentPrioritizationFees.reduce(
            (sum, fee) => sum + fee.prioritizationFee,
            0
          ) / recentPrioritizationFees.length
        : 5000;

    return {
      blockhash,
      feeCalculator: {
        lamportsPerSignature: averageFee,
      },
    };
  } catch (e) {
    throw new Error("failed to get recent blockhash: " + e);
  }
};

(async function () {
  const certImage = createGenericFile(
    await readFile("./src/cert-1.jpg"),
    "cert-1-nft.jpg"
  );
  const [certImageUri] = await umi.uploader.upload([certImage]);
  console.log(certImageUri);

  const certMetadataUri = await umi.uploader.uploadJson({
    name: "Ruth Edwards' Graduation Certificate",
    description:
      "Ruth Edwards' Graduation Certificate, issued by the university of Ohio",
    image: certImageUri,
  });
  console.log(certMetadataUri);

  const assetAddress = generateSigner(umi);
  await createV1(umi, {
    name: "Certificate #1",
    asset: assetAddress,
    uri: certMetadataUri,
  }).sendAndConfirm(umi);
  console.log("Created nft successfully");

  const assetsByOwner = await getAssetV1GpaBuilder(umi)
    .whereField("key", Key.AssetV1)
    .whereField("owner", myKeypairSigner.publicKey)
    .getDeserialized();
  console.log(assetsByOwner);

  // let asset = await fetchAsset(umi, assetAddress.publicKey);

  // await freezeAsset(umi, {
  //   asset,
  //   delegate: myKeypairSigner,
  // }).sendAndConfirm(umi);
  // console.log("Freeze success");

  // await thawAsset(umi, {
  //   asset: await fetchAsset(
  //     umi,
  //     publicKey("7Xn5rH7Jxc...zVFwbzH")
  //   ),
  //   delegate: myKeypairSigner,
  // }).sendAndConfirm(umi);
  // console.log("Unfreeze success");

  // await transferV1(umi, {
  //   asset: assetAddress.publicKey,
  //   newOwner: publicKey("Gq5jLjER...Mt4uf4NJB"),
  // }).sendAndConfirm(umi);
  // console.log("Transfer success");

  // await burn(umi, {
  //   asset: await fetchAsset(
  //     umi,
  //     "9xQoJ1anaH2JXmThZt8EwdpoET3a3fae5aJUGKCSnUuf"
  //   ),
  // }).sendAndConfirm(umi);
  // console.log("Burn success");
})().catch(console.trace);
