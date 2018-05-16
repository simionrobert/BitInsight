using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using Watcher.Models.Search;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace Watcher.Controllers
{
    public class SearchController : Controller
    {
        private ElasticSearchDB _databaseService;

        public SearchController(ElasticSearchDB databaseService)
        {
            _databaseService = databaseService;
        }

        public IActionResult Index(String q)
        {
            if (Utils.ValidateIPv4(ref q))
                return RedirectToAction("Index", "IP", new { q = q });
            else if (q != null)
                ViewBag.QuerryTitle = "Search result for " + q;
            else
                ViewBag.QuerryTitle = "Search result...";
            return View();
        }

        public IActionResult Recent()
        {
            ViewBag.QuerryTitle = "Recent torrents";
            return View("~/Views/Search/Index.cshtml");
        }

        public IActionResult Top()
        {
            ViewBag.QuerryTitle = "Top 100 torrents";
            return View("~/Views/Search/Index.cshtml");
        }

        public JsonResult SearchJSON(String q, int pageIndex, int pageSize, String sortField, String sortOrder)
        {
            int startIndex = (pageIndex - 1) * pageSize;
            IEnumerable<Torrent> torrents = null;

            if (q == null)
                torrents = _databaseService.GetTorrents(startIndex, pageSize, sortField, sortOrder);
            else if (Utils.ValidateIPv4(ref q))
                torrents = _databaseService.GetTorrentsOfIP(q, startIndex, pageSize, sortField, sortOrder);
            else //Search by name
                torrents = _databaseService.SearchTorrentsByName(q, startIndex, pageSize, sortField, sortOrder); 


            return FormatJsonData(torrents, pageIndex,pageSize);
        }

        public JsonResult RecentJSON(int pageIndex, int pageSize, String sortField, String sortOrder)
        {
            if (sortField != null)//To be able to sort recent page
                return SearchJSON(null, pageIndex, pageSize, sortField, sortOrder);
            else
                return SearchJSON(null, pageIndex, pageSize, "date", "desc");
        }

        public JsonResult TopJSON()
        {
            IEnumerable<Torrent> torrents = _databaseService.GetTorrents(0, 99, "peerNumber", "desc");
            return FormatJsonData(torrents, 0, 0);
        }

        public JsonResult BrowseJSON(String id, String tag, int pageIndex, int pageSize, String sortField, String sortOrder)
        {
            int startIndex = (pageIndex - 1) * pageSize;
            IEnumerable<Torrent> torrents;

            if (tag==null) 
                torrents = _databaseService.GetTorrentsByCategory(id, startIndex, pageSize, sortField, sortOrder);
            else
                torrents = _databaseService.GetTorrentsByTags(id, startIndex, pageSize, sortField, sortOrder);

            return FormatJsonData(torrents, pageIndex, pageSize);
        }

        private IEnumerable<TorrentIndexListingModel> ModeliseJsonData(IEnumerable<Torrent> torrents)
        {
            var listingResult = torrents.Select(result => new TorrentIndexListingModel
            {
                ID = result.ID,
                Name = result.Name,
                Date = Utils.FormatDate(result.Date),
                Categories = Utils.FormatTags(result.Categories),
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = Utils.FormatBytes(result.Size),
                PeerNumber = result.Peers
            });

            return listingResult;
        }

        private JsonResult FormatJsonData(IEnumerable<Torrent> torrents, int pageIndex, int pageSize)
        {
            IEnumerable<TorrentIndexListingModel> models = ModeliseJsonData(torrents);

            long count = 0;
            if (pageIndex > 1)
                count = _databaseService.GetTorrentsNumberWithDescription();
            else if (torrents.Count() == pageSize)
                count = _databaseService.GetTorrentsNumberWithDescription();
            else
                count = torrents.Count();

            return Json(new
            {
                data = models,
                itemsCount = count
            });
        }

    }         
}
