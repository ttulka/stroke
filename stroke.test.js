const stroke = require('./stroke')

const expandVariables = program => program.replaceAll(/\d+/g, d => '|'.repeat(d - 0 + 1))

test('error: invalid loop start', () => {
    expect(() => stroke('/')).toThrow()
    expect(() => stroke('/ |')).toThrow()
    expect(() => stroke('/ \\')).toThrow()
    expect(() => stroke('| / \\')).toThrow()
    expect(() => stroke('/ / \\')).toThrow()
})

test('error: invalid loop end', () => {
    expect(() => stroke('\\')).toThrow()
    expect(() => stroke('/ | \\ \\')).toThrow()
})

test('infinite loop', () => {
    expect(() => stroke('| / | \\')).toThrow()
})

test('empty', () => {
    expect(stroke('')).toEqual('')
})

test('flip', () => {
    expect(stroke('|')).toEqual('1')
    expect(stroke('||')).toEqual('01')
    expect(stroke('| ||')).toEqual('11')
    expect(stroke('|| |')).toEqual('11')
    expect(stroke('||| |||||')).toEqual('00101')
    expect(stroke('||| ||||| |')).toEqual('10101')
})

test('loop', () => {
    expect(stroke('| / | | \\')).toEqual('')
    expect(stroke('| / | | || \\')).toEqual('01')
    expect(stroke('| / | / | | || \\ \\')).toEqual('01')
    expect(stroke('| / | || / | | ||| \\ \\')).toEqual('011')
    expect(() => stroke('| / | \\')).toThrow()
})

test('expand variables', () => {
    expect(stroke(expandVariables('0 / 0 1 / 0 0 2 \\ \\'))).toEqual('011')
    expect(stroke(expandVariables('12 0 1 2 5'))).toEqual('1110010000001')
})

test('NZ 1-bit', () => {
    // if v0 == 1 then v1 := 1
    const nz = expandVariables(`
    / 0
      0     end loop
      1     result
      2     reset 
    \\
    / 2 2 0 \\  do reset
    `)
    expect(stroke(nz, '0')).toEqual('')
    expect(stroke(nz, '1')).toEqual('11')
})

test('NZ 4-bit', () => {
    // if A > 0 then v4 := 1
    const nz = expandVariables(`
    6       running
    / 0 0   first bit not zero
      4     result
      5     shall reset bit
      6     stop
    \\
    / 5 5 0 \\  reset bit
    / 6         still running
      / 1 1       second bit not zero
        4         result
        5         shall reset bit
        6         stop
      \\
      / 5 5 1 \\  reset bit
      / 6         still running
        / 2 2       third bit not zero
          4         result
          5         shall reset bit
          6         stop
        \\
        / 5 5 2 \\  reset bit
        / 6         still running
          / 3 3       fourth bit not zero
            4         result
            5         shall reset bit
          \\
          / 5 5 3 \\  reset bit
          6           stop (all bits checked)
        \\
      \\
    \\
    `)
    expect(stroke(nz, '0000')).toEqual('')
    expect(stroke(nz, '0001')).toEqual('00011')
    expect(stroke(nz, '0010')).toEqual('00101')
    expect(stroke(nz, '0011')).toEqual('00111')
    expect(stroke(nz, '0100')).toEqual('01001')
    expect(stroke(nz, '0101')).toEqual('01011')
    expect(stroke(nz, '0110')).toEqual('01101')
    expect(stroke(nz, '0111')).toEqual('01111')
    expect(stroke(nz, '1000')).toEqual('10001')
    expect(stroke(nz, '1001')).toEqual('10011')
    expect(stroke(nz, '1010')).toEqual('10101')
    expect(stroke(nz, '1011')).toEqual('10111')
    expect(stroke(nz, '1100')).toEqual('11001')
    expect(stroke(nz, '1101')).toEqual('11011')
    expect(stroke(nz, '1110')).toEqual('11101')
    expect(stroke(nz, '1111')).toEqual('11111')
})

test('EQ 4-bit', () => {
    // EQ A B => v8
    // v8 = result, v9 = aux reset, v10 = aux A is zero (else), v11 = aux B is zero (else), v12 = aux running
    const eq = expandVariables(`
    8 12 10
    / 0 0 11          A is one
      / 4 4 9 11 \\   B is one
      / 9 9 4 \\      reset B
      / 11 11 8 12 \\ B is zero -> ne+stop
      9 10
    \\
    / 9 9 0 \\        reset A
    / 10 10           A is zero
      / 4 4 9 8 12 \\ B is one -> ne+stop
      / 9 9 4 \\      reset B
    \\
    / 12 10           so far equal
      / 1 1 11          A is one
        / 5 5 9 11 \\   B is one
        / 9 9 5 \\      reset B
        / 11 11 8 12 \\ B is zero -> ne+stop
        9 10
      \\
      / 9 9 1 \\        reset A
      / 10 10           A is zero
        / 5 5 9 8 12 \\ B is one -> ne+stop
        / 9 9 5 \\      reset B
      \\
      / 12 10           so far equal
        / 2 2 11          A is one
          / 6 6 9 11 \\   B is one
          / 9 9 6 \\      reset B
          / 11 11 8 12 \\ B is zero -> ne+stop
          9 10
        \\
        / 9 9 2 \\        reset A
        / 10 10           A is zero
          / 6 6 9 8 12 \\ B is one -> ne+stop
          / 9 9 6 \\      reset B
        \\
        / 12 10           so far equal
          / 3 3 11          A is one
            / 7 7 9 11 \\   B is one
            / 9 9 7 \\      reset B
            / 11 11 8 \\    B is zero -> ne
            9 10
            12              last bit -> stop
          \\
          / 9 9 3 \\        reset A
          / 10 10           A is zero
            / 7 7 9 8 \\    B is one -> ne
            / 9 9 7 \\      reset B
            12              last bit -> stop
          \\
        \\
      \\
    \\        
    `)
    expect(stroke(eq, '0000'+'0000')).toEqual('0000'+'0000'+'1')
    expect(stroke(eq, '0001'+'0001')).toEqual('0001'+'0001'+'1')
    expect(stroke(eq, '1001'+'1001')).toEqual('1001'+'1001'+'1')
    expect(stroke(eq, '1000'+'1000')).toEqual('1000'+'1000'+'1')
    expect(stroke(eq, '1111'+'1111')).toEqual('1111'+'1111'+'1')
    expect(stroke(eq, '1011'+'1011')).toEqual('1011'+'1011'+'1')
    expect(stroke(eq, '0011'+'0011')).toEqual('0011'+'0011'+'1')
    expect(stroke(eq, '0110'+'0110')).toEqual('0110'+'0110'+'1')
    expect(stroke(eq, '1100'+'1100')).toEqual('1100'+'1100'+'1')
    expect(stroke(eq, '0100'+'0100')).toEqual('0100'+'0100'+'1')

    expect(stroke(eq, '0000'+'0001')).toEqual('0000'+'0001')
    expect(stroke(eq, '0000'+'0010')).toEqual('0000'+'001')
    expect(stroke(eq, '0000'+'0100')).toEqual('0000'+'01')
    expect(stroke(eq, '0000'+'1000')).toEqual('0000'+'1')
    expect(stroke(eq, '1000'+'0001')).toEqual('1000'+'0001')
    expect(stroke(eq, '1001'+'0001')).toEqual('1001'+'0001')
    expect(stroke(eq, '1001'+'0101')).toEqual('1001'+'0101')
    expect(stroke(eq, '1001'+'0111')).toEqual('1001'+'0111')
    expect(stroke(eq, '1111'+'0111')).toEqual('1111'+'0111')
    expect(stroke(eq, '1111'+'0110')).toEqual('1111'+'011')
    expect(stroke(eq, '1111'+'1110')).toEqual('1111'+'111')
    expect(stroke(eq, '1001'+'1111')).toEqual('1001'+'1111')
    expect(stroke(eq, '1000'+'1111')).toEqual('1000'+'1111')
    expect(stroke(eq, '1111'+'0000')).toEqual('1111')
    expect(stroke(eq, '0001'+'0000')).toEqual('0001')
    expect(stroke(eq, '0010'+'0000')).toEqual('001')
    expect(stroke(eq, '0100'+'0000')).toEqual('01')
    expect(stroke(eq, '1000'+'0000')).toEqual('1')
})

test('CLR', () => {
    const clr = expandVariables(`
    / 0 0 \\
    / 1 1 \\
    / 2 2 \\
    / 3 3 \\
    `)
    expect(stroke(clr, '0000')).toEqual('')
    expect(stroke(clr, '0001')).toEqual('')
    expect(stroke(clr, '0010')).toEqual('')
    expect(stroke(clr, '0011')).toEqual('')
    expect(stroke(clr, '0100')).toEqual('')
    expect(stroke(clr, '0101')).toEqual('')
    expect(stroke(clr, '0110')).toEqual('')
    expect(stroke(clr, '0111')).toEqual('')
    expect(stroke(clr, '1000')).toEqual('')
    expect(stroke(clr, '1001')).toEqual('')
    expect(stroke(clr, '1010')).toEqual('')
    expect(stroke(clr, '1011')).toEqual('')
    expect(stroke(clr, '1100')).toEqual('')
    expect(stroke(clr, '1101')).toEqual('')
    expect(stroke(clr, '1110')).toEqual('')
    expect(stroke(clr, '1111')).toEqual('')
})

test('INC', () => {
    const inc = expandVariables(`
    5       carry
    / 3 3 4 5 \\
    / 4 4 5 
      / 2 2 4 5 \\
      / 4 4 5
        / 1 1 4 5 \\
        / 4 4 5
          / 0 0 5 \\
          / 5 5 0 \\
        \\
        / 5 5 1 \\
      \\
      / 5 5 2 \\
    \\
    / 5 5 3 \\
    `)
    expect(stroke(inc, '0000')).toEqual('0001')
    expect(stroke(inc, '0001')).toEqual('001')
    expect(stroke(inc, '0010')).toEqual('0011')
    expect(stroke(inc, '0011')).toEqual('01')
    expect(stroke(inc, '0100')).toEqual('0101')
    expect(stroke(inc, '0101')).toEqual('011')
    expect(stroke(inc, '0110')).toEqual('0111')
    expect(stroke(inc, '0111')).toEqual('1')
    expect(stroke(inc, '1000')).toEqual('1001')
    expect(stroke(inc, '1001')).toEqual('101')
    expect(stroke(inc, '1010')).toEqual('1011')
    expect(stroke(inc, '1011')).toEqual('11')
    expect(stroke(inc, '1100')).toEqual('1101')
    expect(stroke(inc, '1101')).toEqual('111')
    expect(stroke(inc, '1110')).toEqual('1111')
    expect(stroke(inc, '1111')).toEqual('')
})

test('DEC', () => {
    const dec = expandVariables(`
    4
    / 3 3 4 \\
    / 4 3
      / 2 2 4 \\
      / 4 2 
        / 1 1 4 \\
        / 4 1 
          / 0 0 4 \\
          / 4 0
            4
          \\
        \\
      \\
    \\      
    `)
    expect(stroke(dec, '0000')).toEqual('1111')
    expect(stroke(dec, '0001')).toEqual('')
    expect(stroke(dec, '0010')).toEqual('0001')
    expect(stroke(dec, '0011')).toEqual('001')
    expect(stroke(dec, '0100')).toEqual('0011')
    expect(stroke(dec, '0101')).toEqual('01')
    expect(stroke(dec, '0110')).toEqual('0101')
    expect(stroke(dec, '0111')).toEqual('011')
    expect(stroke(dec, '1000')).toEqual('0111')
    expect(stroke(dec, '1001')).toEqual('1')
    expect(stroke(dec, '1010')).toEqual('1001')
    expect(stroke(dec, '1011')).toEqual('101')
    expect(stroke(dec, '1100')).toEqual('1011')
    expect(stroke(dec, '1101')).toEqual('11')
    expect(stroke(dec, '1110')).toEqual('1101')
    expect(stroke(dec, '1111')).toEqual('111')
})

test('ADD', () => {
    // adds B to A (descructive)
    const add = expandVariables(`
    NZ B: (init)
    =====
    10      running
    / 4 4   first bit not zero
      8     result
      9     shall reset bit
      10    stop
    \\
    / 9 9 0 \\  reset bit
    / 10        still running
      / 5 5       second bit not zero
        8         result
        9         shall reset bit
        10        stop
      \\
      / 9 9 5 \\  reset bit
      / 10        still running
        / 6 6       third bit not zero
          8         result
          9         shall reset bit
          10        stop
        \\
        / 9 9 6 \\  reset bit
        / 10        still running
          / 7 7       fourth bit not zero
            8         result
            9         shall reset bit
          \\
          / 9 9 7 \\  reset bit
          10          stop (all bits checked)
        \\
      \\
    \\

    / 8     loop start
      8     reset flag

      INC A:
      ======
      9       carry
      / 3 3 8 9 \\
      / 8 8 9 
        / 2 2 8 9 \\
        / 8 8 9
          / 1 1 8 9 \\
          / 8 8 9
            / 0 0 9 \\
            / 9 9 0 \\
          \\
          / 9 9 1 \\
        \\
        / 9 9 2 \\
      \\
      / 9 9 3 \\

      DEC B:
      ======
      8
      / 7 7 8 \\
      / 8 7
        / 6 6 8 \\
        / 8 6 
          / 5 5 8 \\
          / 8 5 
            / 4 4 8 \\
            / 8 4
              8
            \\
          \\
        \\
      \\

      NZ B:
      =====
      10      running
      / 4 4   first bit not zero
        8     result
        9     shall reset bit
        10    stop
      \\
      / 9 9 0 \\  reset bit
      / 10        still running
        / 5 5       second bit not zero
          8         result
          9         shall reset bit
          10        stop
        \\
        / 9 9 5 \\  reset bit
        / 10        still running
          / 6 6       third bit not zero
            8         result
            9         shall reset bit
            10        stop
          \\
          / 9 9 6 \\  reset bit
          / 10        still running
            / 7 7       fourth bit not zero
              8         result
              9         shall reset bit
            \\
            / 9 9 7 \\  reset bit
            10          stop (all bits checked)
          \\
        \\
      \\

    \\    loop end
    `)
    expect(stroke(add, '0000'+'0000')).toEqual('')
    expect(stroke(add, '0000'+'0001')).toEqual('0001')
    expect(stroke(add, '0000'+'0010')).toEqual('001')
    expect(stroke(add, '0000'+'0011')).toEqual('0011')
    expect(stroke(add, '0000'+'0100')).toEqual('01')
    expect(stroke(add, '0000'+'0101')).toEqual('0101')
    expect(stroke(add, '0000'+'0110')).toEqual('011')
    expect(stroke(add, '0000'+'0111')).toEqual('0111')
    expect(stroke(add, '0000'+'1000')).toEqual('1')
    expect(stroke(add, '0000'+'1001')).toEqual('1001')
    expect(stroke(add, '0000'+'1010')).toEqual('101')
    expect(stroke(add, '0000'+'1011')).toEqual('1011')
    expect(stroke(add, '0000'+'1100')).toEqual('11')
    expect(stroke(add, '0000'+'1101')).toEqual('1101')
    expect(stroke(add, '0000'+'1110')).toEqual('111')
    expect(stroke(add, '0000'+'1111')).toEqual('1111')

    expect(stroke(add, '0001'+'0000')).toEqual('0001')
    expect(stroke(add, '0001'+'0001')).toEqual('001')
    expect(stroke(add, '0001'+'0010')).toEqual('0011')
    expect(stroke(add, '0001'+'0011')).toEqual('01')
    expect(stroke(add, '0001'+'0100')).toEqual('0101')
    expect(stroke(add, '0001'+'0101')).toEqual('011')
    expect(stroke(add, '0001'+'0110')).toEqual('0111')
    expect(stroke(add, '0001'+'0111')).toEqual('1')
    expect(stroke(add, '0001'+'1000')).toEqual('1001')
    expect(stroke(add, '0001'+'1001')).toEqual('101')
    expect(stroke(add, '0001'+'1010')).toEqual('1011')
    expect(stroke(add, '0001'+'1011')).toEqual('11')
    expect(stroke(add, '0001'+'1100')).toEqual('1101')
    expect(stroke(add, '0001'+'1101')).toEqual('111')
    expect(stroke(add, '0001'+'1110')).toEqual('1111')
    expect(stroke(add, '0001'+'1111')).toEqual('')

    expect(stroke(add, '0010'+'0000')).toEqual('001')
    expect(stroke(add, '0010'+'0001')).toEqual('0011')
    expect(stroke(add, '0010'+'0010')).toEqual('01')
    expect(stroke(add, '0010'+'0011')).toEqual('0101')
    expect(stroke(add, '0010'+'0100')).toEqual('011')
    expect(stroke(add, '0010'+'0101')).toEqual('0111')
    expect(stroke(add, '0010'+'0110')).toEqual('1')
    expect(stroke(add, '0010'+'0111')).toEqual('1001')
    expect(stroke(add, '0010'+'1000')).toEqual('101')
    expect(stroke(add, '0010'+'1001')).toEqual('1011')
    expect(stroke(add, '0010'+'1010')).toEqual('11')
    expect(stroke(add, '0010'+'1011')).toEqual('1101')
    expect(stroke(add, '0010'+'1100')).toEqual('111')
    expect(stroke(add, '0010'+'1101')).toEqual('1111')
    expect(stroke(add, '0010'+'1110')).toEqual('')

    expect(stroke(add, '1010'+'0011')).toEqual('1101')
    expect(stroke(add, '1010'+'0001')).toEqual('1011')
    expect(stroke(add, '1010'+'0010')).toEqual('11')
    expect(stroke(add, '1111'+'0000')).toEqual('1111')
    expect(stroke(add, '1110'+'0001')).toEqual('1111')
    expect(stroke(add, '1100'+'0011')).toEqual('1111')
})

test('fibonacci', () => {
    const fib = expandVariables(`
    15
    / 15    forever
      
      NZ B:
      =====
      14       running
      / 4 4   first bit not zero
        12     result
        13     shall reset bit
        14     stop
      \\
      / 13 13 4 \\  reset bit
      / 14         still running
        / 5 5       second bit not zero
          12         result
          13         shall reset bit
          14         stop
        \\
        / 13 13 5 \\  reset bit
        / 14         still running
          / 6 6       third bit not zero
            12         result
            13         shall reset bit
            14         stop
          \\
          / 13 13 6 \\  reset bit
          / 14         still running
            / 7 7       fourth bit not zero
              12         result
              13         shall reset bit
            \\
            / 13 13 7 \\  reset bit
            14           stop (all bits checked)
          \\
        \\
      \\

      / 12
      12

        DEC B:
        ======
        12
        / 7 7 12 \\
        / 12 7
          / 6 6 12 \\
          / 12 6 
            / 5 5 12 \\
            / 12 5 
              / 4 4 12 \\
              / 12 4
                12
              \\
            \\
          \\
        \\

        INC C:
        ======
        13       carry
        / 11 11 12 13 \\
        / 12 12 13 
          / 10 10 12 13 \\
          / 12 12 13
            / 9 9 12 13 \\
            / 12 12 13
              / 8 8 13 \\
              / 13 13 8 \\
            \\
            / 13 13 9 \\
          \\
          / 13 13 10 \\
        \\
        / 13 13 11 \\

        NZ B:
        =====
        14       running
        / 4 4   first bit not zero
          12     result
          13     shall reset bit
          14     stop
        \\
        / 13 13 4 \\  reset bit
        / 14         still running
          / 5 5       second bit not zero
            12         result
            13         shall reset bit
            14         stop
          \\
          / 13 13 5 \\  reset bit
          / 14         still running
            / 6 6       third bit not zero
              12         result
              13         shall reset bit
              14         stop
            \\
            / 13 13 6 \\  reset bit
            / 14         still running
              / 7 7       fourth bit not zero
                12         result
                13         shall reset bit
              \\
              / 13 13 7 \\  reset bit
              14           stop (all bits checked)
            \\
          \\
        \\

      \\

      NZ A:
      =====
      14       running
      / 0 0   first bit not zero
        12     result
        13     shall reset bit
        14     stop
      \\
      / 13 13 0 \\  reset bit
      / 14         still running
        / 1 1       second bit not zero
          12         result
          13         shall reset bit
          14         stop
        \\
        / 13 13 1 \\  reset bit
        / 14         still running
          / 2 2       third bit not zero
            12         result
            13         shall reset bit
            14         stop
          \\
          / 13 13 2 \\  reset bit
          / 14         still running
            / 3 3       fourth bit not zero
              12         result
              13         shall reset bit
            \\
            / 13 13 3 \\  reset bit
            14           stop (all bits checked)
          \\
        \\
      \\

      / 12
      12

        DEC A:
        ======
        12
        / 3 3 12 \\
        / 12 3
          / 2 2 12 \\
          / 12 2 
            / 1 1 12 \\
            / 12 1 
              / 0 0 12 \\
              / 12 0
                12
              \\
            \\
          \\
        \\

        INC B:
        ======
        13    carry
        / 7 7 12 13 \\
        / 12 12 13 
          / 6 6 12 13 \\
          / 12 12 13
            / 5 5 12 13 \\
            / 12 12 13
              / 4 4 13 \\
              / 13 13 4 \\
            \\
            / 13 13 5 \\
          \\
          / 13 13 6 \\
        \\
        / 13 13 7 \\
        / 12 12 \\

        NZ A:
        =====
        14       running
        / 0 0   first bit not zero
          12     result
          13     shall reset bit
          14     stop
        \\
        / 13 13 0 \\  reset bit
        / 14         still running
          / 1 1       second bit not zero
            12         result
            13         shall reset bit
            14         stop
          \\
          / 13 13 1 \\  reset bit
          / 14         still running
            / 2 2       third bit not zero
              12         result
              13         shall reset bit
              14         stop
            \\
            / 13 13 2 \\  reset bit
            / 14         still running
              / 3 3       fourth bit not zero
                12         result
                13         shall reset bit
              \\
              / 13 13 3 \\  reset bit
              14           stop (all bits checked)
            \\
          \\
        \\

      \\

      NZ C:
      =====
      14       running
      / 8 8   first bit not zero
        12     result
        13     shall reset bit
        14     stop
      \\
      / 13 13 8 \\  reset bit
      / 14         still running
        / 9 9       second bit not zero
          12         result
          13         shall reset bit
          14         stop
        \\
        / 13 13 9 \\  reset bit
        / 14         still running
          / 10 10       third bit not zero
            12         result
            13         shall reset bit
            14         stop
          \\
          / 13 13 10 \\  reset bit
          / 14         still running
            / 11 11       fourth bit not zero
              12         result
              13         shall reset bit
            \\
            / 13 13 11 \\  reset bit
            14           stop (all bits checked)
          \\
        \\
      \\

      / 12
      12

        DEC C:
        ======
        12
        / 11 11 12 \\
        / 12 11
          / 10 10 12 \\
          / 12 10 
            / 9 9 12 \\
            / 12 9 
              / 8 8 12 \\
              / 12 8
                12
              \\
            \\
          \\
        \\

        INC A:
        ======
        13       carry
        / 3 3 12 13 \\
        / 12 12 13 
          / 2 2 12 13 \\
          / 12 12 13
            / 1 1 12 13 \\
            / 12 12 13
              / 0 0 13 \\
              / 13 13 0 \\
            \\
            / 13 13 1 \\
          \\
          / 13 13 2 \\
        \\
        / 13 13 3 \\

        INC B:
        ======
        13       carry
        / 7 7 12 13 \\
        / 12 12 13 
          / 6 6 12 13 \\
          / 12 12 13
            / 5 5 12 13 \\
            / 12 12 13
              / 4 4 13 \\
              / 13 13 4 \\
            \\
            / 13 13 5 \\
          \\
          / 13 13 6 \\
        \\
        / 13 13 7 \\

        NZ C:
        =====
        14       running
        / 8 8   first bit not zero
          12     result
          13     shall reset bit
          14     stop
        \\
        / 13 13 8 \\  reset bit
        / 14         still running
          / 9 9       second bit not zero
            12         result
            13         shall reset bit
            14         stop
          \\
          / 13 13 9 \\  reset bit
          / 14         still running
            / 10 10       third bit not zero
              12         result
              13         shall reset bit
              14         stop
            \\
            / 13 13 10 \\  reset bit
            / 14         still running
              / 11 11       fourth bit not zero
                12         result
                13         shall reset bit
              \\
              / 13 13 11 \\  reset bit
              14           stop (all bits checked)
            \\
          \\
        \\

      \\

      !   output after each iteration

    \\  
    `)
    const results = [0]
    const onOutput = mem => {
        const r = parseInt(mem.substring(0, 4), 2)
        if (r >= results[results.length - 1])    // filter out overflowed
          results.push(r)
    }
    stroke(fib, '00000001', 10000, onOutput)  // start with 0, 1

    expect(results).toStrictEqual([0, 1, 1, 2, 3, 5, 8, 13])
})

test('Hello World', () => {
    const hello = expandVariables(`
    1 2 4 6 9 12 14 18 19 20 21 23 24 25 27 32
    `)
    const result = stroke(hello)
    expect(result).toEqual('011010100100101000111101110100001')

    const alphabet = []
    alphabet['000'] = ' '
    alphabet['001'] = 'd'
    alphabet['010'] = 'e'
    alphabet['011'] = 'H'
    alphabet['100'] = 'l'
    alphabet['101'] = 'o'
    alphabet['110'] = 'r'
    alphabet['111'] = 'W'

    let msg = ''
    for (let i = 0; i < result.length; i += 3) {
        const ch = result.substring(i, i + 3)
        msg += alphabet[ch]
    }

    expect(msg).toEqual('Hello World')
})
