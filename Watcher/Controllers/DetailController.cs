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
        private ElasticSearchDB _databaseService;


        public DetailController(ElasticSearchDB databaseService)
        {
            _databaseService = databaseService;
        }

        public IActionResult Index(string id)
        {
            Torrent result = _databaseService.GetTorrentByID(id);
            SetIPs ips = _databaseService.GetIPsByTorrent(result.ID);

            TorrentDetailModel model = new TorrentDetailModel
            {

                ID = result.ID,
                Name = result.Name,
                Date = FormatterUtil.FormatDate(result.Date),
                Categories = FormatterUtil.FormatTags(result.Categories),
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = FormatterUtil.FormatBytes(result.Files.Sum(x => x.Size)),
                Files = result.Files.Select(file => new FileDetailModel
                {
                    Name = file.Name,
                    Size = FormatterUtil.FormatBytes(file.Size)
                }),
                NrFiles = result.Files.Count(),
                IPs = new IPIndexListingModel()
                {
                    ID = ips.ID,
                    IPs = ips.IPs,
                    Date = FormatterUtil.FormatDate(ips.Date)
                },
                PeerNumber = ips.IPs.Count()
            };

            return View(model);
        }
    }
}