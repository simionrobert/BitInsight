using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Watcher.Models;
using WatcherDataLayer;

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
            return View();
        }

        public JsonResult GetDownloadedCategoryDistribution()
        {
            StatisticsModel model = new StatisticsModel();

            Dictionary<String, long> categories = _databaseService.GetTorrentCountByCategory();
            foreach(var key in categories)
            {
                model.putEntry(key.Key,key.Value);
            }

            return Json(model);
        }

        public JsonResult GetPopularityCategoryDistribution()
        {
            StatisticsModel model = new StatisticsModel();

            Dictionary<String, long> categories = _databaseService.GetTorrentPeerCountByCategory();
            foreach (var key in categories)
            {
                model.putEntry(key.Key, key.Value);
            }

            return Json(model);
        }
    }
}