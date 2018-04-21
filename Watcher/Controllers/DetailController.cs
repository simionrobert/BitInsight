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
                Date = FormatterUtil.FormatDate(result.Date),
                Categories = FormatterUtil.FormatCategories(result.Categories),
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = FormatterUtil.FormatBytes(result.Files.Sum(x => x.Size)),
                PeerNumber = _torrentService.getTorrentIPsById(result.ID).Count(),
                Files = result.Files.Select(file => new FileDetailModel
                {
                    Name = file.Name,
                    Size = FormatterUtil.FormatBytes(file.Size)
                }),
                NrFiles = result.Files.Count(),
                IPs = _torrentService.getTorrentIPsById(result.ID).Select(ipResults => new IPIndexListingModel
                {
                    ID = ipResults.ID,
                    IPs = ipResults.IPs,
                    Date = FormatterUtil.FormatDate(ipResults.Date)
                })
            };

            return View(model);
        }

    }
}