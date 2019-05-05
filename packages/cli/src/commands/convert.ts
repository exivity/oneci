import { Command, flags } from '@oclif/command'
import { validate, convert } from '@openci/core'
import getStdin = require('get-stdin')
import { getFileContents } from '../common'
import * as yaml from 'js-yaml'
import * as fs from 'fs'

export default class Convert extends Command {
  static description = 'convert an openci configuration'

  static examples = [
    `$ openci convert --target=travis
$ openci convert my.openci.yaml --target=travis --format=json
$ echo "..." | openci convert --target=travis --out=.travis.json
`
  ]

  static flags = {
    help: flags.help({ char: 'h' }),
    target: flags.string({
      char: 't',
      required: true,
      description: 'config target to convert to'
    }),
    out: flags.string({
      char: 'o',
      description: 'write to file instead of stdout'
    }),
    format: flags.string({
      char: 'f',
      description: 'file format',
      default: 'yaml',
      options: ['json', 'yaml']
    }),
    append: flags.boolean({
      char: 'a',
      description: 'append to existing file if --out is given'
    })
  }

  static args = [
    {
      name: 'file',
      description:
        'if not provided, will autodetect .openci.{yml,yaml,json} files in the working directory'
    }
  ]

  async run () {
    const { args, flags } = this.parse(Convert)

    const input = await getStdin()

    if (input && args.file) {
      throw new Error('Both stdin and FILE argument are provided')
    }

    if (flags.append && !flags.out) {
      throw new Error('--out must be used when using --append')
    }

    try {
      let spec
      if (input) {
        spec = JSON.parse(input)
      } else {
        spec = getFileContents(args.file)
      }

      validate(spec)

      const output = convert(spec, flags.target)

      let formatted
      if (
        flags.format === 'json' ||
        (flags.out && flags.out.endsWith('.json'))
      ) {
        formatted = JSON.stringify(output, undefined, 2)
      } else {
        formatted = yaml.safeDump(output, { indent: 2 })
      }

      if (flags.out) {
        fs.writeFileSync(flags.out, formatted)
      } else {
        this.log(formatted)
      }
    } catch (error) {
      this.error(error.message)
      this.exit(1)
    }
  }
}
