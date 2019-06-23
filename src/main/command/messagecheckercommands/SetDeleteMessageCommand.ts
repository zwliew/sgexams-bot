import { Command } from "../Command";
import { Permissions, Message, RichEmbed } from "discord.js";
import { Server } from "../../storage/Server";
import { CommandResult } from "../classes/CommandResult";

export enum ResponseType {
    NO_ARGUMENTS = 0,
    WRONG_FORMAT = 1,
    VALID_FORMAT = 2
}

export class SetDeleteMessageCommand extends Command {
    static COMMAND_NAME = "setdeletemessage";
    static DESCRIPTION = "Sets whether the bot should delete instances of blacklisted words being used.";
    static INCORRECT_FORMAT = "Incorrect format. Use only \"true\" or \"false\"."
    static EMBED_TITLE = "Delete Message";
    static BOOL_CANNOT_BE_UNDEFINED = "Boolean should not be undefined!";

    /** SaveServer: true, CheckMessage: true */
    private COMMAND_SUCCESSFUL_COMMANDRESULT: CommandResult = new CommandResult(true, true);
    /** SaveServer: false, CheckMessage: true */
    private COMMAND_UNSUCCESSFUL_COMMANDRESULT: CommandResult = new CommandResult(false, true);
    private permissions = new Permissions(["KICK_MEMBERS", "BAN_MEMBERS"]);
    private args: string[];

    constructor(args: string[]) {
        super();
        this.args = args;
    }

    /**
     * This function executes the setdeletemessage command
     * Sets the delete message boolean for the server.
     * 
     * @param  {Server} server Server object of the message
     * @param  {Message} message Message object from the bot's on message event
     * @returns CommandResult
     */
    public execute(server: Server, message: Message): CommandResult {
        //Check for permissions first
        if(!this.hasPermissions(this.permissions, message.member.permissions)) {
            return this.NO_PERMISSIONS_COMMANDRESULT;
        }

        //Execute
        if(this.args.length === 0) {
            message.channel.send(this.generateEmbed(ResponseType.NO_ARGUMENTS));
            return this.COMMAND_UNSUCCESSFUL_COMMANDRESULT
        } else {
            const boolStr = this.args[0].toLowerCase();
            const trueFalseRegex = new RegExp(/\btrue\b|\bfalse\b/, "g");
            if(!trueFalseRegex.test(boolStr)) {
                message.channel.send(this.generateEmbed(ResponseType.WRONG_FORMAT));
                return this.COMMAND_UNSUCCESSFUL_COMMANDRESULT;
            }

            let bool: boolean;
            if(boolStr === "true") {
                bool = true;
            }

            if(boolStr === "false") {
                bool = false;
            }

            this.changeServerSettings(server, bool!);
            message.channel.send(this.generateEmbed(ResponseType.VALID_FORMAT, bool!));
            return this.COMMAND_SUCCESSFUL_COMMANDRESULT;
        }
    }

    /**
     * Generates embed that is sent back to user
     * 
     * @param  {ResponseType} type VALID_FORMAT/NO_ARGUMENTS/WRONG_FORMAT
     * @param  {boolean} bool? boolean value if delete message is true or false
     * @returns RichEmbed
     */
    public generateEmbed(type: ResponseType, bool?: boolean): RichEmbed {
        let embed = new RichEmbed();
        if(type === ResponseType.VALID_FORMAT) {
            if(bool === undefined) {
                throw new Error(SetDeleteMessageCommand.BOOL_CANNOT_BE_UNDEFINED);
            }
            let msg = "Delete Message set to: **" + (bool ? "TRUE" : "FALSE") + "**";
            embed.setColor(Command.EMBED_DEFAULT_COLOUR);
            embed.addField(SetDeleteMessageCommand.EMBED_TITLE, msg);
        }
        if(type === ResponseType.NO_ARGUMENTS) {
            embed.setColor(Command.EMBED_ERROR_COLOUR);
            embed.addField(SetDeleteMessageCommand.EMBED_TITLE,
                           SetDeleteMessageCommand.NO_ARGUMENTS);
        }
        if(type === ResponseType.WRONG_FORMAT) {
            embed.setColor(Command.EMBED_ERROR_COLOUR);
            embed.addField(SetDeleteMessageCommand.EMBED_TITLE,
                           SetDeleteMessageCommand.INCORRECT_FORMAT);   
        }
        return embed;
    }
    
    /**
     * Sets if the server should deletemessages
     * 
     * @param  {Server} server Server
     * @param  {boolean} bool deletemessage true or false
     * @returns void
     */
    public changeServerSettings(server: Server, bool: boolean): void {
        server.messageCheckerSettings.setDeleteMessage(bool);
    }
}