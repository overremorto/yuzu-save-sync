import { Syncer } from "./syncer";
import { config } from 'dotenv';
import { Helpers } from "./helpers";
config();


const main = async () => {
    const args = Helpers.processArgs(process.argv);
    const syncer = new Syncer(Helpers.generateSyncerConfig(args));

    await syncer.restore(args.game);
}

main();