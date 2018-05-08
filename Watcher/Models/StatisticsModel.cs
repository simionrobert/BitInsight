using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Watcher.Models
{
    public class StatisticsModel
    {
        public List<long> datasets;
        public List<String> labels;

        public StatisticsModel()
        {
            datasets = new List<long>();
            labels = new List<String>();
         
        }

        public void putEntry(String s,long v)
        {
            labels.Add(s);
            datasets.Add(v);
        }
    }
}
