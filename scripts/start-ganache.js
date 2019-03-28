const { echo, mkdir, pwd, rm, exec } = require('shelljs')

const BASEPATH = pwd().toString()

// TODO cd $(dirname $0) /..

const mnemonic = require(require('path').join(BASEPATH, 'src/helpers/ganache-vars')).MNEMONIC
echo(mnemonic)

rm('-rf','aragon-ganache')
mkdir('aragon-ganache')
// TODO # set - e;
exec(`npx ganache-cli -m "${mnemonic}" -i 15 -l 100000000 --db aragon-ganache`)
