using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Watcher.Models;
using Watcher.Models.Search;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace Watcher.Controllers
{
    public class SearchController : Controller
    {
        private ITorrent _torrentService;

        public SearchController(ITorrent torrents)
        {
            _torrentService = torrents;
        }


        public IActionResult Index(String input)
        {
            IEnumerable<Torrent> torrents = null;
            if (input == "")
                torrents = _torrentService.getAll();
            else
                torrents = _torrentService.GetTorrentsByName(input);

            TorrentIndexModel model = ModeliseSearch(torrents);

            return View(model);
        }

        public IActionResult Recent()
        {
            IEnumerable<Torrent> torrents = _torrentService.GetAllTorrentsSortedDate();

            TorrentIndexModel model = ModeliseSearch(torrents);


            return View("~/Views/Search/Index.cshtml", model);
        }

        public IActionResult Top()
        {
            IEnumerable<Torrent> torrents = _torrentService.GetAllTorrentsSortedPeers();


            TorrentIndexModel model = ModeliseSearch(torrents);

            return View("~/Views/Search/Index.cshtml", model);
        }

        private TorrentIndexModel ModeliseSearch(IEnumerable<Torrent> torrents)
        {
            var listingResult = torrents.Select(result => new TorrentIndexListingModel
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
                PeerNumber = _torrentService.getTorrentIPsById(result.ID).Count()
            });


            TorrentIndexModel model = new TorrentIndexModel
            {
                models = listingResult
            };

            return model;
        }
    }         
}
