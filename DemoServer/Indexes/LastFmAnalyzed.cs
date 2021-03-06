﻿using System.Linq;
using DemoServer.Entities;
using Raven.Client.Documents.Indexes;

namespace DemoServer.Indexes
{
    public class LastFmAnalyzed : AbstractIndexCreationTask<LastFm, LastFmAnalyzed.Result>
    {
        public class Result
        {
            public string Query;
        }

        public LastFmAnalyzed()
        {
            Map = songs => from song in songs
                select new
                {
                    Query = new object[]
                    {
                        song.Artist,
                        song.TimeStamp,
                        song.Tags,
                        song.Title,
                        song.TrackId
                    }
                };

            Index(x => x.Query, FieldIndexing.Search);
            TermVector(x => x.Query, FieldTermVector.Yes);
        }
    }
}