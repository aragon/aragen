const { mkdir, echo, rm, cd, ln } = require('shelljs')

// TODO set -e;
echo('Cleaning and creating "repos" dir')
rm('-rf', 'repos')
mkdir('repos')

cd('repos')

echo('Linking to local repos')
ln('-s', '../../aragonOS', 'aragonOS')
ln('-s', '../../aragon-apps', 'aragon-apps')
ln('-s', '../../aragon-id', 'aragon-id')
ln('-s', '../../dao-kits', 'dao-kits')
