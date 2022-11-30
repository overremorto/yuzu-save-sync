import SETTINGS from '../settings.json';
import GAME_MAPPING from '../mapping.json';
import { resolve } from 'path';

export type TGame = keyof typeof GAME_MAPPING;
export type TSystem = 'yuzu' | 'ryujinx';
export type TSettingsBlobStorage = {
    connectionString: string;
    blobContainer: string;
};
export type TSettingsSystemGame = {
    path?: string;
}
export type TSettingsSystem = {
    saveDirectory: string;
    games?: Record<TGame, TSettingsSystemGame>;
};

export type TSettings = {
    azure: TSettingsBlobStorage;
    saves: Record<TSystem, TSettingsSystem>;
}

export type TArgs = {
    system: TSystem;
    game: TGame;
    settings: TSettings;
}
export class Helpers {
    static processArgs(argv: string[]): TArgs {
        const args: TArgs = {
            system: argv[2] as TSystem,
            game: argv[3] as TGame,
            settings: SETTINGS
        };

        if (!args.system) {
            throw Error('Please specify a system');
        }
        if (!args.game) {
            throw Error('Please specify a game name to save');
        }
        return args;
    }

    static generateSyncerConfig(args: TArgs) {
        const baseSaveDirectory = args.settings.saves[args.system].saveDirectory;
        const gameDirectory = args.settings.saves[args.system].games?.[args.game]?.path || GAME_MAPPING[args.game];
        return {
            connectionString: args.settings.azure.connectionString,
            container: args.settings.azure.blobContainer || 'saves',
            saveDirectory: resolve(baseSaveDirectory, gameDirectory)
        }
    }
}