#!/usr/bin/env node
import { terraform } from "./temp_terraform_try";

const secret = process.env.TEST_SECRET;
console.log(`secret: ${secret}`);

terraform();