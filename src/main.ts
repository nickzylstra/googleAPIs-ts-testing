import drive from './drive';

(async function main() {
  const client = await drive.getClient();
  await drive.listFiles(client);


  setTimeout(() => {
    main();
  }, 30000);
}()).catch((e) => console.log(e.stack));
