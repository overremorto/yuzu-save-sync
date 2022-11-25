
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { basename, resolve } from 'path'
import { readdir, copyFile, mkdir } from 'fs/promises';
import GAME_MAPPING from '../mapping.json';
import { existsSync } from "fs";

export type TGame = keyof typeof GAME_MAPPING;

export interface SyncerConfig {
    connectionString: string;
    container: string;
    saveDirectory: string;
}

export class Syncer {
    blobService: BlobServiceClient;
    container: ContainerClient;
    initialized: boolean;

    constructor(private config: SyncerConfig) {
        this.blobService = BlobServiceClient.fromConnectionString(this.config.connectionString);
        this.container = this.blobService.getContainerClient(this.config.container);
        this.initialized = false;
    }

    async init(): Promise<void> {
        if (this.initialized) {
            return;
        }

        console.log('initializing');
        await this.container.createIfNotExists();
        this.initialized = true;
    }

    async save(gameName: TGame): Promise<void> {
        await this.init();
        const directoryPath = resolve(this.config.saveDirectory, GAME_MAPPING[gameName]);
        const files = await readdir(directoryPath);
        console.log(`found ${files.length} files in "${directoryPath}"`);
        for (const filename of files) {
            const fullFilename = resolve(directoryPath, filename);
            const uploadPath = `${gameName}/${basename(filename)}`;
            const blob = this.container.getBlockBlobClient(uploadPath);
            console.log(`uploading "${fullFilename}" to "${uploadPath}"`);
            await blob.uploadFile(fullFilename);
            console.log(`uploaded "${fullFilename}" to "${uploadPath}"`);
        }
    }

    async restore(gameName: TGame): Promise<void> {
        await this.init();
        const directoryPath = resolve(this.config.saveDirectory, GAME_MAPPING[gameName]);
        await this.localBackup(gameName);
        if (!existsSync(directoryPath)) {
            await mkdir(directoryPath, { recursive: true });
        }
        for await (const blobItem of this.container.listBlobsFlat({ prefix: gameName })) {
            const blob = this.container.getBlockBlobClient(blobItem.name);
            const filename = blob.name.split('/').filter((v, idx) => idx > 0).join('/');
            const downloadPath = resolve(directoryPath, filename);
            console.log(`downloading "${blobItem.name}" to "${downloadPath}"`);
            await blob.downloadToFile(downloadPath);
            console.log(`downloaded "${blobItem.name}" to "${downloadPath}"`);
        }
    }

    async localBackup(gameName: TGame): Promise<void> {
        await this.init();
        const directoryPath = resolve(this.config.saveDirectory, GAME_MAPPING[gameName]);
        if (!existsSync(directoryPath)) {
            console.log(`no files to backup from "${directoryPath}"`)
            return;
        }
        const files = await readdir(directoryPath);
        console.log(`found ${files.length} files in "${directoryPath}"`);
        const backupDirectory = resolve('./backup', `${gameName} - ${GAME_MAPPING[gameName]}`, new Date().toISOString().replace(/[T:]/g, '_').split('.')[0]);
        console.log(`backup directory "${backupDirectory}"`);
        await mkdir(backupDirectory, { recursive: true });
        for (const filename of files) {
            const fullFilename = resolve(directoryPath, filename);
            const backupPath = resolve(backupDirectory, basename(filename));
            console.log(`backing up "${fullFilename}" to "${backupPath}"`);
            await copyFile(fullFilename, backupPath)
        }
    }
}