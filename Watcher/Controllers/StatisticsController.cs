using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Watcher.Models;
using Watcher.Models.Statistics;
using WatcherDataLayer;
using WatcherDataLayer.Models;

namespace Watcher.Controllers
{
    public class StatisticsController : Controller
    {
        private ElasticSearchDB _databaseService;

        public StatisticsController(ElasticSearchDB databaseService)
        {
            _databaseService = databaseService;
        }

        public IActionResult Index()
        {
            Dictionary<String, long> categories = _databaseService.GetTorrentPeerCountByCategory();
            long torrentNrWithDesc = _databaseService.GetTorrentsTotalNumber();
            long torrentNrTotal = _databaseService.GetIPTotalNumber();
            long torrentNrWithPeerListOnly = _databaseService.GetTorrentsWithIPList();



            StatisticsModel model = new StatisticsModel(categories, torrentNrWithDesc, torrentNrTotal, torrentNrWithPeerListOnly);
            return View(model);
        }

        public JsonResult GetDownloadedCategoryDistribution()
        {
            StatisticsModelJSON model = new StatisticsModelJSON();

            Dictionary<String, long> categories = _databaseService.GetTorrentCountByCategory();
            foreach(var key in categories)
            {
                model.PutEntry(key.Key,key.Value);
            }

            return Json(model);
        }

        public JsonResult GetPopularityCategoryDistribution()
        {
            StatisticsModelJSON model = new StatisticsModelJSON();

            Dictionary<String, long> categories = _databaseService.GetTorrentPeerCountByCategory();
            foreach (var key in categories)
            {
                model.PutEntry(key.Key, key.Value);
            }

            return Json(model);
        }


        public JsonResult GetIPTorrentDistribution()
        {
            StatisticsModelJSON model = new StatisticsModelJSON();

            Dictionary<String, long> categories = _databaseService.GetIPTorrentDistribution();
            foreach (var key in categories)
            {
                model.PutEntry(key.Key, key.Value);
            }

            return Json(model);
        }
    }
}