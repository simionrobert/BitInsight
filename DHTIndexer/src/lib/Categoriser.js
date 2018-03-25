'use strict'

const _ = require('lodash');

class Categorizer {
    constructor(opts, metadataFlag, ipFlag) {
        this.videoFormats = ['.wma', '.3g2', '.3gp', '.amv', '.asf', '.avi', '.drc', '.f4a', '.f4b', '.f4p', '.f4v', '.flv', '.gif', '.gifv', '.m2v', '.m4p', '.m4v', '.mkv', '.mng', '.mov', '.mp2', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mxf', '.net', '.nsv', '.ogv', '.qt', '.rm', '.rmvb', '.roq', '.svi', '.vob', '.webm', '.wmv', '.yuv'];
        this.audioFormats = ['.aa', '.aac', '.aax', '.act', '.aiff', '.amr', '.ape', '.au', '.awb', '.dct', '.dss', '.dvf', '.flac', '.gsm', '.iklax', '.ivs', '.m4a', '.m4b', '.mmf', '.mp3', '.mpc', '.msv', '.ogg', '.opus', '.ra', '.raw', '.sln', '.tta', '.vox', '.wav', '.wma', '.wv'];
        this.documentFormats = ['.txt', '.doc', '.docx', '.pdf', '.cbr', '.cbz', '.cb7', '.cbt', '.cba', 'djvu', '.epub', '.fb2', '.ibook', '.azw', '.lit', '.prc', '.mobi', '.pdb', '.pdb', '.oxps', '.xps'];
        this.mediaFormat = ['.bin', '.iso', '.zip', '.rar', '.7z', '.tar.gz', '.dmg'];
    }

	parse(torrent) {
		let newTorrent = {
			...torrent,
			categories: [],
			type: ''
		};

        // Get file with maximum size
        const file = _.maxBy(torrent.files, 'size')
        newTorrent = this.getCategories(file, newTorrent);

		for (let i = 0; i < torrent.files.length; i++) {
            const file = torrent.files[i];
            newTorrent = this.getCategories(file, newTorrent);
        }

		newTorrent.categories = _.uniq(newTorrent.categories);
        delete newTorrent.count;

		return newTorrent;
    }

	getCategories (file, torrent) {
		let newTorrent = torrent;
		const ext = `.${file.name.split('.')[file.name.split('.').length - 1]}`;

        if (this.videoFormats.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'video';
			newTorrent = this.getVideoCategories(file, newTorrent);
		}
        if (this.audioFormats.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'audio';
			newTorrent = this.getAudioCategories(file, newTorrent);
		}
        if ( this.documentFormats.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'doc';
			newTorrent = this.getDocCategories(file, newTorrent);
        }
        if (this.mediaFormat.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'media';
            newTorrent = this.getMediaCategories(file, newTorrent);
        }

		return newTorrent;
	}

	getVideoCategories (file, torrent) {
		if (file.name.match(/season|episode|s[0-9]{2}e[0-9]{2}/i)) {
            torrent.categories.push('TVshow');

        } else if (file.name.match(/[0-9]+x[0-9]+/i)) {
            torrent.categories.push('TVshow');

		} else {
			torrent.categories.push('movie');
		}

        if (file.name.toLowerCase().indexOf('1080') > -1) {
            torrent.categories.push('1080');
		}
        if (file.name.toLowerCase().indexOf('720') > -1) {
            torrent.categories.push('720');
		}
        if (file.name.toLowerCase().indexOf('hd') > -1) {
            torrent.categories.push('HD');
		}
        if (file.name.toLowerCase().indexOf('sd') > -1) {
            torrent.categories.push('SD');
		}
        if (file.name.toLowerCase().indexOf('bdrip') > -1) {
            torrent.categories.push('BDRIP');
		}
        if (file.name.toLowerCase().indexOf('xxx') > -1) {
            torrent.categories.push('XXX');
		}
        if (file.name.toLowerCase().indexOf('dvdrip') > -1) {
            torrent.categories.push('DVDRIP');
		}

		return torrent;
	}

	getAudioCategories (file, torrent) {
		if (torrent.count > 3) {
			torrent.categories.push('album');
		}

		return torrent;
	}

	getDocCategories (file, torrent) {
        if (file.name.indexOf('.epub') != -1) {
			torrent.categories.push('ebook');
            torrent.categories.push('epub');
		}
        if (file.name.indexOf('.mobi') != -1) {
			torrent.categories.push('ebook');
            torrent.categories.push('mobi');
		}
        if (file.name.indexOf('.azw3') != -1) {
			torrent.categories.push('ebook');
            torrent.categories.push('kindle');
		}

		return torrent;
	}

    getMediaCategories(file, torrent) {
        if (file.name.indexOf('.bin')!=-1) {
            torrent.categories.push('image');
        }
        if (file.name.indexOf('.iso') != -1) {
            torrent.categories.push('image');
        }
        if (file.name.indexOf('.rar') != -1) {
            torrent.categories.push('archive');
        }
        if (file.name.indexOf('.7z') != -1) {
            torrent.categories.push('archive');
        }
        if (file.name.indexOf('.zip') != -1) {
            torrent.categories.push('archive');
        }

        return torrent;
    }
}

module.exports = Categorizer;