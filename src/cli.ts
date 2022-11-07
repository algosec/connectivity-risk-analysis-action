#!/usr/bin/env node
import { Main } from "./main";

const secret = process.env.TEST_SECRET;
console.log(`secret: ${secret}`);

const codeAnalyzer = new Main();
codeAnalyzer.run();