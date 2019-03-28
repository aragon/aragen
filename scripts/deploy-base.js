const { echo, exec, cd, exit, rm } = require('shelljs')
require('./set-env')

echo('Make sure you are on an empty chain running with the default mnemonic')
// sleep 2; # let the people read

echo('Deploying ENS instance')
cd('repos/aragonOS')
// exec('npx truffle compile')
const DEPLOYED_ENS = exec('npx truffle exec --network rpc scripts/deploy-test-ens.js') //| tail -n 1
console.log(DEPLOYED_ENS.stdout)

if(process.env.ENS === DEPLOYED_ENS) {
	echo('ENS deployed $DEPLOYED_ENS')
} else {
	// echo >&2 "ENS address missmatch. Please restart ganache by running:";
	echo('ENS address missmatch. Please restart ganache by running:')
	echo('npm run start-ganache')
	rm('-rf', 'aragon-ganache')
	exit(1)
}

echo('Deploying APM registry to aragonpm.eth')
exec('npx truffle exec --network rpc scripts/deploy-apm.js')

cd('../aragon-id')
echo('Deploying aragonID registry to aragonpm.eth')
exec('npx truffle compile')
exec('npx truffle exec --network rpc scripts/deploy-beta-aragonid.js')
