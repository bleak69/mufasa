import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { getPaginationRow } from '../../utils/components.js';

const QUEUE_PAGE_SIZE = 10;

export const MUSIC_BUTTON_IDS = {
    PAUSE: 'music_pause',
    RESUME: 'music_resume',
    SKIP: 'music_skip',
    STOP: 'music_stop',
    SHUFFLE: 'music_shuffle',
    LOOP: 'music_loop',
    VOL_DOWN: 'music_vol_down',
    VOL_UP: 'music_vol_up',
    QUEUE: 'music_queue',
    QUEUE_FIRST: 'music_queue_first',
    QUEUE_PREV: 'music_queue_prev',
    QUEUE_NEXT: 'music_queue_next',
    QUEUE_LAST: 'music_queue_last',
};

export function formatDuration(ms) {
    if (!ms || Number.isNaN(ms)) {
        return 'Live';
    }
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getTrackArtwork(track) {
    return track?.info?.artworkUrl || track?.info?.thumbnail || null;
}

function getLoopLabel(loop) {
    switch (loop) {
        case 'track':
            return '🔂 Track';
        case 'queue':
            return '🔁 Queue';
        default:
            return '⊘ Off';
    }
}

function buildProgressBar(current, max, size = 12) {
    if (!max || max === 0) return '▬▬▬▬▬▬▬▬▬▬▬▬';
    
    const progress = Math.min(Math.max(0, current / max), 1);
    const filled = Math.round(size * progress);
    const empty = size - filled;
    return `${'▰'.repeat(filled)}${'▱'.repeat(empty)}`;
}

function getPlayStatusEmoji(paused) {
    return paused ? '⏸️ Paused' : '▶️ Playing';
}

export function buildNowPlayingEmbed(track, player, guildData) {
    const requester = track?.info?.requester;
    const requesterLabel = requester
        ? (requester.username || requester.tag || 'Unknown')
        : 'Unknown';

    const position = formatDuration(player?.position || 0);
    const duration = formatDuration(track?.info?.length || 0);
    
    const progressBar = buildProgressBar(player?.position || 0, track?.info?.length || 1);
    
    // Enhanced description with better formatting
    const description = `
╭─ 🎵 **${track?.info?.title || 'Unknown Track'}**
├─ Artist: **${track?.info?.author || 'Unknown'}**
├─ Requested by: **${requesterLabel}**
╰─ Source: **${track?.info?.sourceName || 'YouTube'}**

${progressBar}
**${position}** / **${duration}**
`;

    return createEmbed({
        title: '🎶 Now Playing',
        description: description.trim(),
        color: 'primary',
        fields: [
            { 
                name: '📊 Status', 
                value: `${getPlayStatusEmoji(player?.paused)} • Volume: **${guildData?.volume ?? 75}%** 🔊`, 
                inline: true 
            },
            { 
                name: '🔄 Loop', 
                value: getLoopLabel(guildData?.loop), 
                inline: true 
            },
            { 
                name: '📋 Queue', 
                value: `**${player?.queue?.length || 0}** track(s) queued`, 
                inline: true 
            },
            {
                name: '⏱️ Duration',
                value: `**${duration}**`,
                inline: true
            },
            {
                name: '🔀 Shuffle',
                value: guildData?.shuffle ? '✅ On' : '❌ Off',
                inline: true
            },
            {
                name: '👥 Queue Size',
                value: `**${player?.queue?.length || 0}** tracks`,
                inline: true
            },
        ],
        thumbnail: getTrackArtwork(track),
        footer: `🎵 Powered by Mufasa • ${player?.paused ? 'Paused' : 'Playing'}`,
    });
}

export function buildQueueEmbed(queue, currentTrack, page = 0) {
    const totalTracks = queue?.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalTracks / QUEUE_PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * QUEUE_PAGE_SIZE;
    const slice = queue?.slice(start, start + QUEUE_PAGE_SIZE) || [];

    let description = '';
    
    // Now Playing section
    if (currentTrack) {
        description += `╭─ 🎵 **NOW PLAYING**\n`;
        description += `├─ ${currentTrack.info?.title || 'Unknown'}\n`;
        description += `├─ By: ${currentTrack.info?.author || 'Unknown'}\n`;
        description += `╰─ Duration: ${formatDuration(currentTrack.info?.length || 0)}\n\n`;
    }

    // Queue section
    if (slice.length === 0) {
        description += '📭 The queue is empty.';
    } else {
        description += '╭─ 📋 **QUEUE**\n';
        slice.forEach((track, index) => {
            const num = start + index + 1;
            const duration = formatDuration(track.info?.length || 0);
            const isLast = index === slice.length - 1;
            const prefix = isLast ? '╰─' : '├─';
            description += `${prefix} **${num}.** ${track.info?.title || 'Unknown'} **(${duration})**\n`;
            description += `│  └─ By: ${track.info?.author || 'Unknown'}\n`;
        });
    }

    return createEmbed({
        title: '📋 Music Queue',
        description: description.substring(0, 4096),
        color: 'info',
        footer: `Page ${safePage + 1} of ${totalPages} • ${totalTracks} total tracks`,
    });
}

export function buildPlayerButtonRows(player, guildData) {
    const paused = player?.paused;
    
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.PAUSE)
            .setLabel('Pause')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⏸️')
            .setDisabled(Boolean(paused)),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.RESUME)
            .setLabel('Resume')
            .setStyle(ButtonStyle.Success)
            .setEmoji('▶️')
            .setDisabled(!paused),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.SKIP)
            .setLabel('Skip')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⏭️'),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.STOP)
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⏹️'),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.SHUFFLE)
            .setLabel('Shuffle')
            .setStyle(guildData?.shuffle ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji('🔀'),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.LOOP)
            .setLabel('Loop')
            .setStyle(guildData?.loop !== 'none' ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji('🔁'),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.VOL_DOWN)
            .setLabel('Vol -')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔉'),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.VOL_UP)
            .setLabel('Vol +')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔊'),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_IDS.QUEUE)
            .setLabel('Queue')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋'),
    );

    return [row1, row2];
}

export function buildQueuePaginationRow(page, totalPages) {
    return getPaginationRow('music_queue', page + 1, totalPages);
}

export function getQueuePageSize() {
    return QUEUE_PAGE_SIZE;
}
