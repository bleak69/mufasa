import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { buildQueueReply } from '../../services/music/musicActions.js';
import { logger } from '../../utils/logger.js';

export default {
    slashOnly: true,
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue')
        .addIntegerOption((opt) =>
            opt
                .setName('page')
                .setDescription('Page number to display')
                .setMinValue(1),
        ),

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });
            const requestedPage = interaction.options.getInteger('page') || 1;
            
            // Validate page number
            if (requestedPage < 1) {
                await InteractionHelper.safeEditReply(interaction, {
                    content: '❌ Page number must be at least 1.',
                });
                return;
            }
            
            const payload = buildQueueReply(client, interaction.guild.id, requestedPage - 1);
            
            // Show page info
            const pageInfo = `Page ${payload.page + 1}/${payload.totalPages}`;
            
            await InteractionHelper.safeEditReply(interaction, {
                embeds: payload.embeds,
                components: payload.components,
                content: payload.totalPages > 1 ? `📄 ${pageInfo}` : null,
            });
            
            logger.debug(`Queue command: page ${payload.page + 1}/${payload.totalPages}`, {
                guildId: interaction.guild.id,
                userId: interaction.user.id,
            });
        } catch (error) {
            await handleInteractionError(interaction, error, { command: 'queue' });
        }
    },
};
