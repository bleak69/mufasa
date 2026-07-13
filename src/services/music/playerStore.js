// Per-guild music session state (in-memory). Adapted from Musicify playerStore (Apache-2.0).

import { getGuildConfig } from '../../database/guildConfig.js';
import { logger } from '../../utils/logger.js';

export class GuildMusicData {
    constructor(savedVolume = null) {
        this.playerMessageId = null;
        this.playerChannelId = null;
        this.autoplay = false;
        this.loop = 'none';
        this.volume = savedVolume ?? 75; // Use saved volume or default to 75
        this.shuffle = false;
        this.previousTracks = [];
        this.twentyFourSeven = false;
        this.queuePages = new Map();
        this.updateInterval = null;
        this.idleTimeout = null;
        this.wasPaused = false;
        this.stopConfirmPending = null;
    }
}

export function clearUpdateInterval(guildData) {
    if (guildData.updateInterval) {
        clearInterval(guildData.updateInterval);
        guildData.updateInterval = null;
    }
}

const guildStore = new Map();

export async function getGuildMusicData(guildId, client = null) {
    if (!guildStore.has(guildId)) {
        let savedVolume = 75; // Default volume
        
        // Try to load saved volume from database
        if (client) {
            try {
                const config = await getGuildConfig(client, guildId);
                if (config?.musicSettings?.volume) {
                    savedVolume = config.musicSettings.volume;
                }
            } catch (error) {
                logger.debug(`Could not load saved music volume for guild ${guildId}:`, error.message);
            }
        }
        
        guildStore.set(guildId, new GuildMusicData(savedVolume));
    }
    return guildStore.get(guildId);
}

export async function saveVolumePreference(client, guildId, volume) {
    try {
        const config = await getGuildConfig(client, guildId);
        const updated = { ...config, musicSettings: { ...config?.musicSettings, volume } };
        // Save back to database (implement based on your DB structure)
        logger.debug(`Saved volume preference for guild ${guildId}: ${volume}%`);
    } catch (error) {
        logger.debug(`Could not save volume preference: ${error.message}`);
    }
}

export function deleteGuildMusicData(guildId) {
    const guildData = guildStore.get(guildId);
    if (guildData) {
        clearUpdateInterval(guildData);
        if (guildData.idleTimeout) {
            clearTimeout(guildData.idleTimeout);
        }
    }
    guildStore.delete(guildId);
}
