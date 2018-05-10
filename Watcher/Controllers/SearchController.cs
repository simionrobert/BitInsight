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
            if (Utils.ValidateIPv4(q)) //TODO: Modify here IP page
                ViewBag.QuerryTitle = "All torrents downloaded/uploaded by "+q;
            else if(q!=null)
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
            IEnumerable<Torrent> torrents = null;
            int startIndex = (pageIndex - 1) * pageSize;

            // first level querry
            if (q == null)
                torrents = _databaseService.GetTorrents(startIndex, pageSize, sortField, sortOrder);
            else if (Utils.ValidateIPv4(q)) //TODO: Searching IPs gives IP description not torrents
                torrents = _databaseService.GetTorrentsByIP(q, startIndex, pageSize, sortField, sortOrder);
            else
                torrents = _databaseService.SearchTorrentsByName(q, startIndex, pageSize, sortField, sortOrder); //Search by name


            IEnumerable<TorrentIndexListingModel> models = ModeliseSearch(torrents);

            return Json(new {
                data = models,
                itemsCount = models.Count()
            });
        }

        public JsonResult RecentJSON(int pageIndex, int pageSize, String sortField, String sortOrder)
        {
            if (sortField != null) //To be able to sort recent page
                return SearchJSON(null, pageIndex,  pageSize,  sortField,  sortOrder);

            int startIndex = (pageIndex - 1) * pageSize;

            IEnumerable<Torrent> torrents = _databaseService.GetTorrents(startIndex, pageSize, "date", "desc");

            IEnumerable<TorrentIndexListingModel> models = ModeliseSearch(torrents);
            return Json(new
            {
                data = models,
                itemsCount = models.Count()
            });
        }

        public JsonResult TopJSON()
        {
            IEnumerable<Torrent> torrents = _databaseService.GetTorrents(1, 100, "peerNumber", "desc");

            IEnumerable<TorrentIndexListingModel> models = ModeliseSearch(torrents);
            return Json(new
            {
                data = models,
                itemsCount = models.Count()
            });
        }

        public JsonResult BrowseJSON(String id, String tag, int pageIndex, int pageSize, String sortField, String sortOrder)
        {
            int startIndex = (pageIndex - 1) * pageSize;
            IEnumerable<Torrent> torrents;

            if (tag==null) 
                torrents = _databaseService.GetTorrentsByCategory(id, startIndex, pageSize, sortField, sortOrder);
            else
                torrents = _databaseService.GetTorrentsByTags(id, startIndex, pageSize, sortField, sortOrder);


            IEnumerable<TorrentIndexListingModel> models = ModeliseSearch(torrents);
            return Json(new
            {
                data = models,
                itemsCount = models.Count()
            });
        }

        private IEnumerable<TorrentIndexListingModel> ModeliseSearch(IEnumerable<Torrent> torrents)
        {
            var listingResult = torrents.Select(result => new TorrentIndexListingModel
            {
                ID = result.ID,
                Name = result.Name,
                Date = FormatterUtil.FormatDate(result.Date),
                Categories = FormatterUtil.FormatTags(result.Categories),
                Type = result.Type,
                MagnetLink = result.MagnetLink,
                Size = FormatterUtil.FormatBytes(result.Size),
                PeerNumber = result.Peers
            });

            return listingResult;
        }


    }         
}
