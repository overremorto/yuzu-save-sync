import { Syncer, TGame } from "./syncer";
import { config } from 'dotenv';
config();


const main = async () => {
    const gameName = process.argv[2] as TGame;
    if (!gameName) {
        throw Error('Please specify a game name to save');
    }
    const syncer = new Syncer({
        connectionString: process.env.BLOB_CONNECTION_STRING!,
        container: process.env.BLOB_CONTAINER || 'saves',
        saveDirectory: process.env.BASE_SAVE_DIRECTORY!
    });

    await syncer.restore(gameName);
}

main();