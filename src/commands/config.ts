import { CommandModule } from "yargs";

export let ConfigCommand: CommandModule = {
    command: "config <name> [value]",
    aliases: "c",
    describe: "set the config",
    handler: (argv) => {
        console.log("config", argv)
    }
}