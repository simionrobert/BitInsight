using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Watcher.Models
{
    public class StatisticsModelJSON
    {
        public List<long> datasets;
        public List<String> labels;


        public StatisticsModelJSON()
        {
            datasets = new List<long>();
            labels = new List<String>();
        }

        public void PutEntry(String s,long v)
        {
            labels.Add(s);
            datasets.Add(v);
        }
    }
}
