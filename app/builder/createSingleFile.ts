import { Config } from "./config";
import * as fs from "node:fs";
import { stringify } from "node:querystring";
import * as path from "path";

export function createSingleFile(config: Config) {
	const luaFile = config.targetPluginPath + "/main.lua";
	const sourceFolder = "./src/images/";
	if (!fs.existsSync(sourceFolder)) {
		return;
	}

	const luaContentCrlf = fs.readFileSync(luaFile);

	const lines: string[] = [];

	for (let i = 0; i < luaContentCrlf.length; i += 1024) {
		const chunk = luaContentCrlf.subarray(i, i + 1024);
		const chunkBase64 = chunk.toString("base64");
		lines.push('\t\t\t\t<Block Base64="' + chunkBase64 + '"/>');
	}

	let xml = '<?xml version="1.0" encoding="UTF-8"?> \n';
	xml += "<GMA3> \n";
	xml += "\t<UserPlugin Name=" + config.pluginName + "> \n";
	xml += "\t\t<ComponentLua> \n";
	xml += "\t\t\t<FileContent Size=" + lines.length + ">\n";
	xml = xml += lines.join("\n");
	xml += "\n \t\t\t</FileContent>\n";
	xml += "\t\t</ComponentLua> \n";
	xml += "\t</UserPlugin> \n";

	const imagefiles = fs.readdirSync(sourceFolder).filter((fileName) => !fileName.startsWith("."));
	xml += '<DependencyExport Size="' + imagefiles.length + '">\n';

	imagefiles.forEach((fileName) => {
		if (path.extname(fileName) === ".png") {
			const data = fs.readFileSync(path.join(sourceFolder, fileName));
			const lines: string[] = [];
			for (let i = 0; i < data.length; i += 1024) {
				const chunk = data.subarray(i, i + 1024);
				const chunkBase64 = chunk.toString("base64");
				lines.push('\t\t\t\t<Block Base64="' + chunkBase64 + '"/>');
			}

			xml += '\t <Dependency Address="ShowData.MediaPools.Images.' + path.basename(fileName, ".png") + '">\n';
			xml += "\t\t <UserImage>\n";
			xml += "\t\t\t <FileContent Size=" + lines.length + ">\n";
			xml += lines.join("\n");
			xml += "\n\t\t\t </FileContent>\n";
			xml += "\t\t </UserImage>\n";
			xml += "\t </Dependency>\n";
		} else {
			process.exit();
		}
	});
	xml += "</DependencyExport>\n";
	xml += "</GMA3> \n";

	fs.writeFileSync(config.targetPluginPath + "/" + config.pluginName.replaceAll(" ", "_") + ".xml", xml, {
		encoding: "utf-8",
	});
}
