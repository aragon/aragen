const { echo, exec } = require('shelljs')
const kill = require('kill-port-process')

async function execute () {
  echo('Checking if the port 8545 is busy')
  try {
    await kill(8545)
  } catch (e) {
    echo('Nothing was running on port 8545')
  }

  echo('Starting ganache in the background')

  // TODO nohup npm run start-ganache &
  exec('npm run start-ganache', {
    detached: true // is it working?
  })
}

execute()
