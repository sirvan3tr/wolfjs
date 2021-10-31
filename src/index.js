const examples = require('./wolfjs_examples.js');

const tabs = 4  // tab spaces

const lines = examples.test3.split('\n');

var l = 0;
var main = [];
var stack = [];
while (l < lines.length) {
    const line = lines[l];
    const spaces = line.search(/\S/);
    if (spaces <= stack[stack.length - 1]) {
        const paddingChars = new Array(spaces + 1).join(' ');
        main.push(`${paddingChars}}`);
        stack.pop();
    }
    if (line[line.length - 1] === ':') {
        line = `${line.substring(0, line.length - 1)} {`;
        stack.push(spaces);
    }
    main.push(line)
    l++
}

// If there is anything left in the stack, then 
// process them.
if (stack.length != 0) {
    for (const s of stack) {
        main.push('}');
    }
}

console.log(main)

// output the final processed data into a file
const fs = require('fs')

fs.writeFile('./output.js', main.join('\n'), err => {
  if (err) {
    console.error(err)
    return
  }
  //file written successfully
})
