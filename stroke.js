const MAX_STEPS = 1000000

const interpret = (program, memory, maxSteps, onOutput) => {    
    // initialize
    const p = parse(program)
    const m = memory ? parseMemoryString(memory) : []
    const ms = maxSteps > 0 ? maxSteps : MAX_STEPS

    // execute
    let pc = 0   // program counter
    let sc = 0   // step counter
    while (pc < p.length && sc <= ms) {
        const inst = p[pc]

        switch (inst.cmd) {
            case '*': {
                m[inst.variable] = m[inst.variable] ? 0 : 1
                pc++
                break
            }
            case '[': {
                if (!m[inst.variable]) pc = findNextLoopEnd(p, pc) + 1
                else pc++
                break
            }
            case ']': {
                pc = findPreviousLoopStart(p, pc)
                break
            }
            case '!': {
                if (onOutput instanceof Function) onOutput(memoryAsString(m))
                pc++
                break
            }
        }

        sc++
    }

    if (sc > MAX_STEPS) throw new Error('Maximal steps exceeded')

    return memoryAsString(m)

    function findPreviousLoopStart(p, pc) {
        let pairs = 0
        while (pc > 0) {
            pc--
            if (p[pc].cmd === ']') pairs++
            if (p[pc].cmd === '[') {
                if (!pairs) return pc
                pairs--
            }
        }
        throw new Error('Loop start not found')
    }

    function findNextLoopEnd(p, pc) {
        let pairs = 0
        while (pc < p.length - 1) {
            pc++
            if (p[pc].cmd === '[') pairs++
            if (p[pc].cmd === ']') {
                if (!pairs) return pc
                pairs--
            }
        }
        throw new Error('Loop end not found')
    }

    function parseMemoryString(m) {
        memory = []
        m = '' + m
        for (let i = 0; i < m.length; i++) {
            memory[i] = m[i] === '1' ? 1 : 0 
        }
        return memory
    }

    function memoryAsString(m) {
        let s = ''
        const l = Math.max(...Object.keys(m))
        for (let i = 0; i <= l; i++) {
            s += m[i] ? '1' : '0'
        }
        return s.replace(/0+$/, '')  // trim trailing zeros
    }
}

// parse the program to AST
function parse(program) {    
    const source = program
        .replaceAll(/[^\s\\/|!]/g, '') // remove all ignored chars
        .replaceAll(/\s+/g, ' ') // normalize white spaces
        .split(' ') // to array
        .filter(s => /[\s\\/|!]+/.test(s))  // filter out new lines etc

    const ast = []
    let open = 0 // count of open loops
    for (let i = 0; i < source.length; i++) {
        const cmd = source[i]
        
        if (/[|]+/.test(cmd)) { // flip variable
            ast.push(new Instr('*', cmd.length - 1))
        } else
        if (/[/]/.test(cmd)) { // loop start
            open++
            i++
            if (i >= source.length || !/[|]+/.test(source[i])) throw new Error('Syntax error: missing loop variable at ' + i)
            ast.push(new Instr('[', source[i].length - 1))
        } else
        if (/[\\]/.test(cmd)) { // loop end
            open--
            ast.push(new Instr(']'))
        } else
        if (/!+/.test(cmd)) { // output
            ast.push(new Instr('!'))
        } else 
            throw new Error('Syntax error: invalid command "' + cmd + '" at ' + i)

        if (open < 0) throw new Error('Syntax error: missing loop start at ' + i)
    }

    if (open) throw new Error('Syntax error: missing loop end(s)')

    return ast
}

class Instr {
    constructor(cmd, variable) {
        this.cmd = cmd
        this.variable = variable
    }
}

module.exports = interpret