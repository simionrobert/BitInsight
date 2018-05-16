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
            long torrentNrWithDesc = _databaseService.GetTorrentsNumberWithDescription();
            long torrentNrTotal = _databaseService.GetTorrentsTotalNumber();
            long torrentNrWithPeerListOnly = _databaseService.GetTorrentsNumberWithIP();

            StatisticsModel model = new StatisticsModel(categories, torrentNrWithDesc, torrentNrTotal,
                torrentNrWithPeerListOnly, null,null,null);
            return View(model);
        }

        public IActionResult World()
        {
            Dictionary<String, long> topCity = _databaseService.GetTopCities();
            Dictionary<String, long> topCountry = _databaseService.GetTopCountries();
            Dictionary<String, long> topContinents = _databaseService.GetTopContinents();

            StatisticsModel model = new StatisticsModel(null, 0, 0, 0, 
                topCity, topCountry, topContinents);
            return View("~/Views/Statistics/World.cshtml", model);
        }

        public JsonResult GetTopCities(String q)
        {
            Dictionary<String, long> topCity = _databaseService.GetTopCities(q);

            return Json(topCity);
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