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
            RelationModel ips = _databaseService.GetIPsOfTorrent(result.ID);

            TorrentDetailModel model = new TorrentDetailModel
            {

                ID = result.ID,
                Name = result.Name,
                Date = Utils.FormatDate(result.Date),
                Categories = Utils.FormatTags(result.Categories),
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = Utils.FormatBytes(result.Size),
                Files = result.Files.Select(file => new TorrentDetailModel.FileDetailModel
                {
                    Name = file.Name,
                    Size = Utils.FormatBytes(file.Size)
                }),
                NrFiles = result.Files.Count(),
                IPs = ips.IPs,
                PeerNumber = result.Peers
            };

            return View(model);
        }
    }
}