const crypto = require('crypto'),
      nacl = require('tweetnacl');

const utilModules = {
	generateV4: () => {
		// https://gist.github.com/jed/982883
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b=>(b^crypto.rng(1)[0]%16>>b/4).toString(16));
	},
	Utf8ArrayToStr: array => {
		// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
		let out, i, len, c;
		let char2, char3;

		out = "";
		len = array.length;
		i = 0;
		while(i < len) {
			c = array[i++];
			switch(c >> 4)
			{
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
				// 0xxxxxxx
				out += String.fromCharCode(c);
				break;
				case 12: case 13:
				// 110x xxxx   10xx xxxx
				char2 = array[i++];
				out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
				break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					char2 = array[i++];
					char3 = array[i++];
					out += String.fromCharCode(((c & 0x0F) << 12) |
						((char2 & 0x3F) << 6) |
						((char3 & 0x3F) << 0));
					break;
			}
		}

		return out;
	},
	hash: (salt, string) => {
		return utilModules.Utf8ArrayToStr(nacl.hash(Uint8Array.from(`${salt}${string}`)))
	},
	createMessage: (type, response) => {
		return {
			type,
			response
		}
	}
};

module.exports = utilModules;
