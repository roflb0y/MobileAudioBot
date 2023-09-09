import chalk from "chalk";
import * as utils from "./utils.js"

export function info(message) {
    console.log(chalk.greenBright(`[${utils.getLogDate()}] INFO: ${message}`));
};

export function process(message) {
    console.log(chalk.magentaBright(`[${utils.getLogDate()}] PROCESS: ${message}`));
};

export function error(message) {
    console.log(chalk.redBright(`[${utils.getLogDate()}] ERROR: ${message}`));
};