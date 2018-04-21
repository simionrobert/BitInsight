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

        public IActionResult Browse(String type)
        {
            IEnumerable<Torrent> torrents = _torrentService.GetTorrentsByCategory(type);


            TorrentIndexModel model = ModeliseSearch(torrents);

            return View("~/Views/Search/Index.cshtml", model);
        }

        private TorrentIndexModel ModeliseSearch(IEnumerable<Torrent> torrents)
        {
            var listingResult = torrents.Select(result => new TorrentIndexListingModel
            {
                ID = result.ID,
                Name = result.Name,
                Date = FormatterUtil.FormatDate(result.Date),
                Categories = FormatterUtil.FormatCategories(result.Categories),
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = FormatterUtil.FormatBytes(result.Files.Sum(x => x.Size)),
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
