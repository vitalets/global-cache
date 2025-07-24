#!/bin/bash

# Exit on any error
set -euo pipefail

rm -rf ./dist
npx tsc -p tsconfig.build.json

# copy 'dist' to 'example/node_modules/' to allow import from 'global-storage'.
rm -rf ./example/node_modules/@vitalets/global-storage
mkdir -p ./example/node_modules/@vitalets/global-storage
cp -R ./dist ./example/node_modules/@vitalets/global-storage/
cp ./package.json ./example/node_modules/@vitalets/global-storage/