import { exec } from "child_process";

/*
https://github.com/soimy/msdf-bmfont-xml
// note : font path as to be absolute, doen't work with relative path

Options:
  -V, --version                 output the version number
  -f, --output-type <format>    font file format: xml(default) | json | txt (default: "xml")
  -o, --filename <atlas_path>   filename of font textures (defaut: font-face)
                                font filename always set to font-face name
  -s, --font-size <fontSize>    font size for generated textures (default: 42)
  -i, --charset-file <charset>  user-specified charactors from text-file
  -m, --texture-size <w,h>      ouput texture atlas size (default: [2048,2048])
  -p, --texture-padding <n>     padding between glyphs (default: 1)
  -b, --border <n>              space between glyphs textures & edge (default: 0)
  -r, --distance-range <n>      distance range for SDF (default: 4)
  -t, --field-type <type>       msdf(default) | sdf | psdf (default: "msdf")
  -d, --round-decimal <digit>   rounded digits of the output font file. (default: 0)
  -v, --vector                  generate svg vector file for debuging
  -u, --reuse [file.cfg]        save/create config file for reusing settings (default: false)
      --smart-size              shrink atlas to the smallest possible square
      --pot                     atlas size shall be power of 2
      --square                  atlas size shall be square
      --rot                     allow 90-degree rotation while packing
      --rtl                     use RTL(Arabic/Persian) charactors fix
  -h, --help                    output usage information
*/
const fontname = "PPRadioGrotesk-Regular";
const extension = "otf";
const font = `src/fonts/${fontname}.${extension}`;
const destination = `src/output/${fontname}`;
const size = 512;
const fontsize = 42;
const definition = 0;

const command = `npx msdf-bmfont -f json -m ${size},${size} -s ${fontsize} -d ${definition} --pot --smart-size -o ${destination} ${font}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});
