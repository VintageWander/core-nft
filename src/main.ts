import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  generateSigner,
  publicKey,
  signerIdentity,
  some,
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
} from "@metaplex-foundation/mpl-core";

const umi = createUmi("https://api.devnet.solana.com", "finalized");
umi.use(irysUploader());

import wallet from "/Users/wander/.config/solana/id.json";
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));

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
})().catch(console.error);
