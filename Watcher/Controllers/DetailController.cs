using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Watcher.Models.Search;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace Watcher.Controllers
{
    public class DetailController : Controller
    {
        private ITorrent _torrentService;

        public DetailController(ITorrent torrents)
        {
            _torrentService = torrents;
        }

        public IActionResult Index(string id)
        {
            Torrent result = _torrentService.getById(id);

            TorrentDetailModel model = new TorrentDetailModel
            {

                ID = result.ID,
                Name = result.Name,
                Date = new DateTime(1970, 1, 1).AddMilliseconds(Double.Parse(result.Date)),
                Categories = result.FormattedCategories,
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = (result.Files.Sum(x => x.Size)) < 1000000000
                ? (result.Files.Sum(x => x.Size) / 1000000.00).ToString("f2") + " MB"
                : (result.Files.Sum(x => x.Size) / 1000000000.00).ToString("f2") + " GB",
                PeerNumber = _torrentService.getTorrentIPsById(result.ID).Count(),
                Files = result.Files,
                IPs = _torrentService.getTorrentIPsById(result.ID).Select(ipResults => new IPIndexListingModel
                {
                    ID = ipResults.ID,
                    IPs = ipResults.IPs,
                    Date = new DateTime(1970, 1, 1).AddMilliseconds(Double.Parse(ipResults.Date))
                })
            };

            return View(model);
        }
    }
}