import { Message } from 'discord.js';
import { CommandParser } from '../command/CommandParser';
import { CommandResult } from '../command/classes/CommandResult';
import { Storage } from '../storage/Storage';
import { MessageChecker } from '../modules/messagechecker/MessageChecker';
import { MessageResponse } from '../modules/messagechecker/response/MessageResponse';
import { MessageUpdateEventHandler } from './MessageUpdateEventHandler';

export class MessageEventHandler extends MessageUpdateEventHandler {
    public static EVENT_NAME = 'message';

    private botId: string;

    public constructor(message: Message,
                       storage: Storage,
                       botId: string) {
        super(storage, message);
        this.botId = botId;
    }

    /**
     * Handles message event
     *
     * @returns Promise
     */
    public async handleEvent(): Promise<void> {
        // If it is a DM, ignore.
        if (this.message.guild === null) return;
        // If it's a bot, ignore :)
        if (this.message.author.bot) return;

        const server = this.getServer(this.message.guild.id.toString());

        // Default command result - do not save, check messages.
        let commandResult = new CommandResult(false, true);

        // If it's a command, execute the command
        const commandParser = new CommandParser(this.message.content);
        if (commandParser.isCommand(this.botId)) {
            commandResult = commandParser.getCommand().execute(server, this.message);
        }

        if (commandResult.shouldSaveServers) this.storage.saveServers();

        // Retrieve settings
        const bannedWords = server.messageCheckerSettings.getBannedWords();
        const reportingChannelId = server.messageCheckerSettings.getReportingChannelId();
        const responseMessage = server.messageCheckerSettings.getResponseMessage();
        const deleteMessage = server.messageCheckerSettings.getDeleteMessage();

        if (commandResult.shouldCheckMessage) {
            const result
                = await new MessageChecker().checkMessage(this.message.content, bannedWords);
            if (result.guilty) {
                new MessageResponse(this.message)
                    .sendReport(result, reportingChannelId)
                    .sendMessageToUser(responseMessage)
                    .deleteMessage(deleteMessage);
            }
        }
    }
}