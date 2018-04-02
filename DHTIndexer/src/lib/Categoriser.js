'use strict'

const _ = require('lodash');

class Categorizer {

    /*
     *Type is determined solely by extension
     * Category is determined by name
     */
    constructor(opts, metadataFlag, ipFlag) {
        this.videoFormats = ['.wma', '.3g2', '.3gp', '.amv', '.asf', '.avi', '.drc', '.f4a', '.f4b', '.f4p', '.f4v', '.flv', '.gif', '.gifv', '.m2v', '.m4p', '.m4v', '.mkv', '.mng', '.mov', '.mp2', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mxf', '.net', '.nsv', '.ogv', '.qt', '.rm', '.rmvb', '.roq', '.svi', '.vob', '.webm', '.wmv', '.yuv'];
        this.audioFormats = ['.aa', '.aac', '.aax', '.act', '.aiff', '.amr', '.ape', '.au', '.awb', '.dct', '.dss', '.dvf', '.flac', '.gsm', '.iklax', '.ivs', '.m4a', '.m4b', '.mmf', '.mp3', '.mpc', '.msv', '.ogg', '.opus', '.ra', '.raw', '.sln', '.tta', '.vox', '.wav', '.wma', '.wv'];
        this.documentFormats = ['.pptx', '.ppt', '.csv', '.txt', '.doc', '.docx', '.pdf', '.cbr', '.cbz', '.cb7', '.cbt', '.cba', 'djvu', '.epub', '.fb2', '.ibook', '.azw', '.lit', '.prc', '.mobi', '.pdb', '.pdb', '.oxps', '.xps', '.xls', '.xlsx'];
        this.mediaFormat = ['.bin', '.iso', '.dmg', '.cue', '.mdf', '.zip', '.rar', '.7z', '.tar.gz', '.deb'];
        this.photoFormat = ['.jpg','.png','.gif','.bmp','.psd','.tif','.tiff','.svg']
    }

	parse(torrent) {
		let newTorrent = {
			...torrent,
			categories: [],
			type: ''
		};

        // Categorise by torrent Name
        this.getVideoCategories(newTorrent, newTorrent);
        this.getMediaCategories(newTorrent, newTorrent);

        // Categorise by file with maximum size
        const file = _.maxBy(torrent.files, 'size')
        this.getCategories(file, newTorrent);

		newTorrent.categories = _.uniq(newTorrent.categories);
        delete newTorrent.count;

		return newTorrent;
    }

	getCategories(file, torrent) {
        let newTorrent = torrent;
        const ext = `.${file.name.split('.')[file.name.split('.').length - 1]}`;

        if (this.videoFormats.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'video';

            newTorrent = this.getVideoCategories(file, newTorrent);
        } else if (this.audioFormats.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'audio';

        } else if (this.documentFormats.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'doc';

            newTorrent = this.getDocCategories(file, newTorrent);
        } else if (this.mediaFormat.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'media';

            newTorrent = this.getMediaCategories(file, newTorrent);
        } else if (this.photoFormat.indexOf(ext) > -1) {
            if (torrent.type === '')
                torrent.type = 'picture';
        } else {

            //default categorise by name if the extension is not recognised
            this.getVideoCategories(file, newTorrent);
            this.getMediaCategories(file, newTorrent);
            this.getDocCategories(file, newTorrent);
        }


        return newTorrent;
    }

	getVideoCategories (file, torrent) {
        if (file.name.toLowerCase().match(/season|episode|s[0-9]{2}e[0-9]{2}/i)) {
            torrent.categories.push('TVshow');

        } else if (file.name.match(/[0-9]+x[0-9]+/i)) {
            torrent.categories.push('TVshow');

        } else if (torrent.type == 'video') {

            //default for video
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
        if (file.name.toLowerCase().indexOf('dvdrip') > -1) {
            torrent.categories.push('DVDRIP');
        }
        if (file.name.toLowerCase().indexOf('xxx') > -1) {
            torrent.categories.push('XXX');
        } else if (file.name.toLowerCase().indexOf('porn') > -1) {
            torrent.categories.push('XXX');
        } else if (file.name.toLowerCase().indexOf('fuck') > -1) {
            torrent.categories.push('XXX');
        } else  if (file.name.toLowerCase().indexOf('cam') > -1) {
            torrent.categories.push('XXX');
        } else if (file.name.toLowerCase().indexOf('sex') > -1) {
            torrent.categories.push('XXX');
        } else if (file.name.toLowerCase().indexOf('censored') > -1) {
            torrent.categories.push('XXX');
        }
	}

	getDocCategories (file, torrent) {
        if (file.name.indexOf('.epub') != -1) {
			torrent.categories.push('ebook');
		}
        if (file.name.indexOf('.mobi') != -1) {
			torrent.categories.push('ebook');
		}
        if (file.name.indexOf('.azw3') != -1) {
			torrent.categories.push('ebook');
		}
	}

    getMediaCategories(file, torrent) {
        if (file.name.toLowerCase().indexOf('codex') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('skidrow') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('reloaded') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('plaza') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('gog') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('razor1911') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('hi2u') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('tinyiso') > -1) {
            torrent.categories.push('game');
        } else if (file.name.toLowerCase().indexOf('postmortem') > -1) {
            torrent.categories.push('game');
        }
    }
}

module.exports = Categorizer;